"""
Pipeline Orchestrator for CarnaMapa scraper.

Main entry point that orchestrates all scraping steps:
1. Scrape cities in parallel
2. Collect addresses needing geocoding
3. Batch geocode using GeocodingPool
4. Generate output JSON files per city
"""

import argparse
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Any, Set, Tuple

from config import CITIES
from city_scraper import CityScraper
from geocoding_pool import GeocodingPool
from geocoder import Geocoder
from utils import (
    setup_logging,
    create_geojson_feature,
    create_geojson_collection,
    save_geojson,
)


logger = logging.getLogger(__name__)


class Pipeline:
    """
    Pipeline orchestrator for CarnaMapa scraping.

    Coordinates city scraping, geocoding, and output generation.
    """

    def __init__(
        self,
        cities: Optional[List[str]] = None,
        dry_run: bool = False,
        force_refresh: bool = False,
        retry_failed: bool = False,
    ):
        """
        Initialize the pipeline.

        Args:
            cities: List of city slugs to scrape (default: all)
            dry_run: If True, don't write output files
            force_refresh: If True, ignore existing data and re-scrape everything
            retry_failed: If True, retry previously failed geocoding attempts
        """
        self.cities_to_scrape = cities or list(CITIES.keys())
        self.dry_run = dry_run
        self.force_refresh = force_refresh
        self.retry_failed = retry_failed

        # Validate cities
        for city_slug in self.cities_to_scrape:
            if city_slug not in CITIES:
                raise ValueError(f"Unknown city: {city_slug}")

        # Shared geocoder instance for cache reuse
        self.geocoder = Geocoder()

        # Statistics tracking
        self.stats = {
            'cities_scraped': 0,
            'events_found': 0,
            'events_scraped': 0,
            'events_skipped': 0,
            'geocoded_success': 0,
            'geocoded_failed': 0,
            'errors': 0,
        }

        # Storage for scraped events by city
        self.city_events: Dict[str, List[Dict[str, Any]]] = {}

    def _scrape_city(self, city_slug: str) -> Tuple[str, List[Dict[str, Any]], Dict[str, int]]:
        """
        Scrape a single city.

        Args:
            city_slug: The city slug to scrape

        Returns:
            Tuple of (city_slug, events_list, stats_dict)
        """
        city_config = CITIES[city_slug]

        scraper = CityScraper(
            city_name=city_config['name'],
            city_url=city_config['url'],
            city_slug=city_slug,
        )

        events = scraper.scrape()
        stats = scraper.get_stats()

        return (city_slug, events, stats)

    def step1_scrape_cities(self) -> None:
        """
        Step 1: Scrape all cities in parallel using ThreadPoolExecutor.
        """
        logger.info("="*60)
        logger.info("STEP 1: Scraping cities in parallel")
        logger.info("="*60)
        logger.info(f"Cities to scrape: {', '.join(self.cities_to_scrape)}")

        # One thread per city
        with ThreadPoolExecutor(max_workers=len(self.cities_to_scrape)) as executor:
            # Submit all city scraping tasks
            future_to_city = {
                executor.submit(self._scrape_city, city_slug): city_slug
                for city_slug in self.cities_to_scrape
            }

            # Collect results as they complete
            for future in as_completed(future_to_city):
                city_slug = future_to_city[future]

                try:
                    slug, events, city_stats = future.result()

                    self.city_events[slug] = events
                    self.stats['cities_scraped'] += 1
                    self.stats['events_found'] += city_stats['events_found']
                    self.stats['events_scraped'] += city_stats['events_scraped']
                    self.stats['events_skipped'] += city_stats['events_skipped']
                    self.stats['errors'] += city_stats['errors']

                    logger.info(f"Completed {slug}: {len(events)} events scraped")

                except Exception as e:
                    logger.error(f"Failed to scrape {city_slug}: {e}")
                    self.stats['errors'] += 1
                    self.city_events[city_slug] = []

    def step2_collect_addresses(self) -> List[Tuple[str, str]]:
        """
        Step 2: Collect all unique addresses needing geocoding.

        Returns:
            List of (address, city) tuples to geocode
        """
        logger.info("="*60)
        logger.info("STEP 2: Collecting addresses for geocoding")
        logger.info("="*60)

        addresses_to_geocode: Set[Tuple[str, str]] = set()

        for city_slug, events in self.city_events.items():
            for event in events:
                if event.get('needs_geocoding', False):
                    query = event.get('geocoding_query')
                    city = event.get('city')
                    if query and city:
                        addresses_to_geocode.add((query, city))

        unique_addresses = list(addresses_to_geocode)
        logger.info(f"Found {len(unique_addresses)} unique addresses to geocode")

        return unique_addresses

    def step3_batch_geocode(self, addresses: List[Tuple[str, str]]) -> Dict[str, Optional[Tuple[float, float]]]:
        """
        Step 3: Batch geocode addresses using GeocodingPool.

        Args:
            addresses: List of (address, city) tuples

        Returns:
            Dict mapping "address|city" keys to coordinates or None
        """
        logger.info("="*60)
        logger.info("STEP 3: Batch geocoding addresses")
        logger.info("="*60)

        if not addresses:
            logger.info("No addresses to geocode")
            return {}

        pool = GeocodingPool(addresses, geocoder=self.geocoder)
        results = pool.geocode_all()

        # Count successes and failures
        successes = sum(1 for v in results.values() if v is not None)
        failures = len(results) - successes

        self.stats['geocoded_success'] = successes
        self.stats['geocoded_failed'] = failures

        logger.info(f"Geocoding complete: {successes} succeeded, {failures} failed")

        return results

    def step4_generate_output(self, geocode_results: Dict[str, Optional[Tuple[float, float]]]) -> None:
        """
        Step 4: Generate output JSON files per city.

        Args:
            geocode_results: Dict mapping "address|city" to coordinates
        """
        logger.info("="*60)
        logger.info("STEP 4: Generating output files")
        logger.info("="*60)

        if self.dry_run:
            logger.info("DRY RUN: Skipping output file generation")
            return

        output_dir = 'output'
        os.makedirs(output_dir, exist_ok=True)

        for city_slug, events in self.city_events.items():
            if not events:
                logger.info(f"No events to save for {city_slug}")
                continue

            city_name = CITIES[city_slug]['name']

            # Apply geocoding results to events
            for event in events:
                if event.get('needs_geocoding', False):
                    query = event.get('geocoding_query')
                    city = event.get('city')
                    if query and city:
                        key = f"{query}|{city}"
                        coords = geocode_results.get(key)
                        if coords:
                            event['coordinates'] = list(coords)
                            event['needs_geocoding'] = False
                            # Keep geocoding_query for reference

            # Create GeoJSON features
            features = [create_geojson_feature(event) for event in events]

            # Create FeatureCollection
            geojson = create_geojson_collection(features, city_name, city_slug)

            # Save to file
            filepath = os.path.join(output_dir, f"{city_slug}.json")
            save_geojson(geojson, filepath)

            # Count events still needing geocoding
            still_need_geocoding = sum(1 for e in events if e.get('needs_geocoding', False))

            logger.info(f"Saved {len(features)} events to {filepath}")
            if still_need_geocoding > 0:
                logger.warning(f"  {still_need_geocoding} events still need geocoding")

    def print_summary(self) -> None:
        """
        Print pipeline summary statistics.
        """
        geocoding_stats = self.geocoder.get_stats()

        print("\n" + "="*60)
        print("PIPELINE SUMMARY")
        print("="*60)
        print(f"Cities scraped:       {self.stats['cities_scraped']}")
        print(f"Events found:         {self.stats['events_found']}")
        print(f"Events scraped:       {self.stats['events_scraped']}")
        print(f"Events skipped:       {self.stats['events_skipped']}")
        print(f"Geocoded success:     {self.stats['geocoded_success']}")
        print(f"Geocoded failed:      {self.stats['geocoded_failed']}")
        print(f"Errors:               {self.stats['errors']}")
        print("\nGeocoding Cache Stats:")
        print(f"  Total queries:      {geocoding_stats['total_queries']}")
        print(f"  Successful:         {geocoding_stats['successful']}")
        print(f"  Failed:             {geocoding_stats['failed']}")
        print(f"  Nominatim hits:     {geocoding_stats['nominatim_hits']}")
        print(f"  Google hits:        {geocoding_stats['google_hits']}")
        print(f"  Hit rate:           {geocoding_stats['hit_rate']}")
        print("="*60)

    def run(self) -> None:
        """
        Run the complete pipeline.
        """
        logger.info("Starting CarnaMapa Pipeline")

        if self.dry_run:
            logger.info("DRY RUN mode enabled - no files will be written")

        if self.force_refresh:
            logger.info("FORCE REFRESH mode enabled - ignoring existing data")

        # Step 1: Scrape all cities
        self.step1_scrape_cities()

        # Step 2: Collect addresses needing geocoding
        addresses = self.step2_collect_addresses()

        # Step 3: Batch geocode
        geocode_results = self.step3_batch_geocode(addresses)

        # Step 4: Generate output files
        self.step4_generate_output(geocode_results)

        # Print summary
        self.print_summary()

        logger.info("Pipeline complete!")


def parse_args() -> argparse.Namespace:
    """
    Parse command line arguments.
    """
    parser = argparse.ArgumentParser(
        description='CarnaMapa Pipeline Orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pipeline.py                          # Scrape all cities
  python pipeline.py --cities sao-paulo,rio-de-janeiro
  python pipeline.py --dry-run                # Test without writing files
  python pipeline.py --retry-failed           # Retry failed geocoding
        """
    )

    parser.add_argument(
        '--cities',
        type=str,
        default=None,
        help='Comma-separated list of city slugs to scrape (default: all)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without writing output files'
    )

    parser.add_argument(
        '--force-refresh',
        action='store_true',
        help='Ignore existing data and re-scrape everything'
    )

    parser.add_argument(
        '--retry-failed',
        action='store_true',
        help='Retry previously failed geocoding attempts using Google API'
    )

    return parser.parse_args()


def main():
    """
    Main entry point.
    """
    # Set up logging
    os.makedirs('logs', exist_ok=True)
    setup_logging('logs/pipeline.log')

    # Parse arguments
    args = parse_args()

    # Parse cities list
    cities = None
    if args.cities:
        cities = [c.strip() for c in args.cities.split(',')]

    try:
        # Create and run pipeline
        pipeline = Pipeline(
            cities=cities,
            dry_run=args.dry_run,
            force_refresh=args.force_refresh,
            retry_failed=args.retry_failed,
        )

        pipeline.run()

    except ValueError as e:
        logger.error(str(e))
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\nPipeline interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise


if __name__ == '__main__':
    main()
