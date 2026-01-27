"""
Retry geocoding for blocks that failed with Nominatim using Google Maps API.
This script reads the output JSON files, finds blocks with null coordinates,
and retries geocoding using Google Maps Geocoding API.
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from geocoder import Geocoder
from utils import setup_logging, validate_coordinates


def load_geojson(filepath: str) -> Dict[str, Any]:
    """Load GeoJSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_geojson(data: Dict[str, Any], filepath: str):
    """Save GeoJSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def retry_failed_geocoding(filepath: str, geocoder: Geocoder, logger: logging.Logger) -> Dict[str, int]:
    """
    Retry geocoding for blocks with null coordinates in a GeoJSON file.

    Args:
        filepath: Path to the GeoJSON file
        geocoder: Geocoder instance (should be using Google Maps API)
        logger: Logger instance

    Returns:
        Dictionary with stats (total, retried, succeeded, failed)
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing: {filepath}")
    logger.info(f"{'='*60}")

    # Load the GeoJSON file
    geojson = load_geojson(filepath)
    city_name = geojson['metadata']['city']

    stats = {
        'total_features': len(geojson['features']),
        'needs_retry': 0,
        'retried': 0,
        'succeeded': 0,
        'still_failed': 0
    }

    # Find features that need geocoding
    for feature in geojson['features']:
        if feature['geometry']['coordinates'] is None:
            stats['needs_retry'] += 1

    logger.info(f"Total blocks: {stats['total_features']}")
    logger.info(f"Blocks needing geocoding: {stats['needs_retry']}")

    if stats['needs_retry'] == 0:
        logger.info("✓ No blocks need geocoding!")
        return stats

    # Retry geocoding for each failed block
    for i, feature in enumerate(geojson['features']):
        if feature['geometry']['coordinates'] is None:
            stats['retried'] += 1

            block_id = feature['id']
            geocoding_query = feature['properties'].get('geocoding_query')

            if not geocoding_query:
                # Fallback to address or neighborhood
                geocoding_query = feature['properties'].get('address') or feature['properties']['neighborhood']

            logger.info(f"[{stats['retried']}/{stats['needs_retry']}] Retrying: {block_id}")

            # Retry geocoding
            coordinates = geocoder.geocode(geocoding_query, city_name)

            if coordinates:
                # Update the feature
                feature['geometry']['coordinates'] = list(coordinates)
                feature['properties']['needs_geocoding'] = False
                feature['properties']['geocoding_query'] = None
                stats['succeeded'] += 1
                logger.info(f"  ✓ Success: {coordinates}")
            else:
                stats['still_failed'] += 1
                logger.warning(f"  ✗ Still failed: {geocoding_query}")

    # Update metadata
    geojson['metadata']['total_blocks'] = sum(
        1 for f in geojson['features']
        if f['geometry']['coordinates'] is not None
    )
    geojson['metadata']['blocks_without_coordinates'] = sum(
        1 for f in geojson['features']
        if f['geometry']['coordinates'] is None
    )

    # Save updated file
    save_geojson(geojson, filepath)

    logger.info(f"\n✓ Updated {filepath}")
    logger.info(f"  Succeeded: {stats['succeeded']}")
    logger.info(f"  Still failed: {stats['still_failed']}")

    return stats


def main():
    """Main entry point."""
    load_dotenv()

    # Check for Google Maps API key
    if not os.getenv('GOOGLE_MAPS_API_KEY'):
        print("❌ ERROR: GOOGLE_MAPS_API_KEY not found in .env file")
        print("Please add your Google Maps Geocoding API key to .env:")
        print("  GOOGLE_MAPS_API_KEY=your_key_here")
        sys.exit(1)

    logger = setup_logging('logs/retry_geocoding.log')
    logger.info("🔄 Starting geocoding retry with Google Maps API")

    # Initialize geocoder (will use Google Maps API if key is present)
    geocoder = Geocoder()

    # Get all JSON files in output directory
    output_dir = 'output'
    json_files = [f for f in os.listdir(output_dir) if f.endswith('.json')]

    if not json_files:
        logger.warning(f"No JSON files found in {output_dir}/")
        return

    # Process specific files if provided as arguments
    if len(sys.argv) > 1:
        files_to_process = [f"{city}.json" for city in sys.argv[1:]]
    else:
        files_to_process = json_files

    total_stats = {
        'files_processed': 0,
        'total_retried': 0,
        'total_succeeded': 0,
        'total_failed': 0
    }

    # Process each file
    for filename in files_to_process:
        filepath = os.path.join(output_dir, filename)
        if not os.path.exists(filepath):
            logger.warning(f"File not found: {filepath}")
            continue

        stats = retry_failed_geocoding(filepath, geocoder, logger)
        total_stats['files_processed'] += 1
        total_stats['total_retried'] += stats['retried']
        total_stats['total_succeeded'] += stats['succeeded']
        total_stats['total_failed'] += stats['still_failed']

    # Print final summary
    logger.info("\n" + "="*60)
    logger.info("RETRY COMPLETE")
    logger.info("="*60)
    logger.info(f"Files processed:    {total_stats['files_processed']}")
    logger.info(f"Blocks retried:     {total_stats['total_retried']}")
    logger.info(f"Succeeded:          {total_stats['total_succeeded']}")
    logger.info(f"Still failed:       {total_stats['total_failed']}")
    logger.info("="*60)

    # Print geocoding stats
    geocoding_stats = geocoder.get_stats()
    logger.info("\nGoogle Maps API Stats:")
    logger.info(f"Total queries:      {geocoding_stats['total_queries']}")
    logger.info(f"Successful:         {geocoding_stats['successful']}")
    logger.info(f"Failed:             {geocoding_stats['failed']}")
    logger.info(f"Hit rate:           {geocoding_stats['hit_rate']}")
    logger.info("="*60)


if __name__ == '__main__':
    main()
