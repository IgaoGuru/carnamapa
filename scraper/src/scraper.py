"""
CarnaMapa Scraper - Extract carnival block data from blocosderua.com
"""

import os
import sys
import time
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

from config import CITIES, USER_AGENT, REQUESTS_TIMEOUT
from geocoder import Geocoder
from utils import (
    setup_logging,
    extract_id_from_url,
    parse_date,
    parse_time,
    parse_price,
    create_datetime_iso,
    create_geojson_feature,
    create_geojson_collection,
    save_geojson
)


class CarnaMapaScraper:
    """Main scraper class for blocosderua.com"""

    def __init__(self, requests_delay: float = 2.0):
        self.logger = setup_logging()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': USER_AGENT})
        self.requests_delay = requests_delay
        self.geocoder = Geocoder()
        self.stats = {
            'cities_scraped': 0,
            'pages_scraped': 0,
            'blocks_found': 0,
            'blocks_scraped': 0,
            'blocks_geocoded': 0,
            'blocks_need_geocoding': 0,
            'errors': 0
        }

    def _make_request(self, url: str) -> Optional[BeautifulSoup]:
        """Make HTTP request with error handling."""
        try:
            time.sleep(self.requests_delay)  # Rate limiting
            self.logger.info(f"Fetching: {url}")

            response = self.session.get(url, timeout=REQUESTS_TIMEOUT)
            response.raise_for_status()

            return BeautifulSoup(response.content, 'html.parser')

        except requests.RequestException as e:
            self.logger.error(f"Request failed for {url}: {e}")
            self.stats['errors'] += 1
            return None

    def get_block_urls_from_page(self, soup: BeautifulSoup) -> List[str]:
        """Extract block URLs from a city listing page."""
        block_urls = []

        # Find all card elements
        cards = soup.find_all('a', class_='card-programacao')

        for card in cards:
            href = card.get('href')
            if href:
                # Convert relative URLs to absolute
                if href.startswith('/'):
                    href = f"https://www.blocosderua.com{href}"
                block_urls.append(href)

        return block_urls

    def get_all_block_urls_for_city(self, base_url: str) -> List[str]:
        """Get all block URLs from paginated city listing."""
        all_urls = []
        page_num = 1

        while True:
            # First page has no /page/1, subsequent pages do
            if page_num == 1:
                page_url = base_url
            else:
                page_url = f"{base_url}/page/{page_num}/"

            soup = self._make_request(page_url)
            if not soup:
                break

            block_urls = self.get_block_urls_from_page(soup)

            if not block_urls:
                self.logger.info(f"No more blocks found on page {page_num}")
                break

            all_urls.extend(block_urls)
            self.stats['pages_scraped'] += 1
            self.logger.info(f"Page {page_num}: Found {len(block_urls)} blocks")

            # Check if there's a next page link
            next_link = soup.find('a', string=lambda s: s and 'Próximos' in s)
            if not next_link:
                break

            page_num += 1

        self.logger.info(f"Total blocks found: {len(all_urls)}")
        return all_urls

    def scrape_block_page(self, url: str, city: str) -> Optional[Dict[str, Any]]:
        """Scrape individual block detail page using JSON-LD structured data."""
        soup = self._make_request(url)
        if not soup:
            return None

        try:
            import json
            import re

            block_data = {
                'id': extract_id_from_url(url),
                'source_url': url,
                'city': city
            }

            # Try to find JSON-LD structured data first (most reliable)
            json_ld = soup.find('script', type='application/ld+json')
            if json_ld:
                try:
                    schema_data = json.loads(json_ld.string)

                    # Extract name
                    block_data['name'] = schema_data.get('name', '').strip()

                    # Extract date and time from startDate (ISO format)
                    start_date = schema_data.get('startDate', '')
                    if start_date:
                        # Format: "2026-01-27T19:00-03:00"
                        date_part = start_date.split('T')[0]
                        time_part = start_date.split('T')[1].split('-')[0] if 'T' in start_date else '00:00'
                        block_data['date'] = date_part
                        block_data['time'] = time_part[:5]  # HH:MM
                        block_data['datetime'] = start_date

                    # Extract location data
                    location = schema_data.get('location', {})
                    if isinstance(location, dict):
                        address_data = location.get('address', {})
                        if isinstance(address_data, dict):
                            # Get neighborhood from addressRegion
                            block_data['neighborhood'] = address_data.get('addressRegion', 'Centro')

                            # Get full address from streetAddress
                            street = address_data.get('streetAddress', '')
                            if street:
                                block_data['address'] = street
                            else:
                                block_data['address'] = None
                        else:
                            block_data['neighborhood'] = 'Centro'
                            block_data['address'] = None

                    # Extract price
                    offers = schema_data.get('offers', {})
                    if isinstance(offers, dict):
                        price_value = offers.get('price')
                        if price_value == 0 or price_value == '0':
                            block_data['price'] = None
                            block_data['price_formatted'] = 'Gratuito'
                            block_data['is_free'] = True
                        elif price_value:
                            block_data['price'] = float(price_value)
                            block_data['price_formatted'] = f"R$ {float(price_value):.2f}".replace('.', ',')
                            block_data['is_free'] = False
                        else:
                            block_data['price'] = None
                            block_data['price_formatted'] = 'Gratuito'
                            block_data['is_free'] = True
                    else:
                        block_data['price'] = None
                        block_data['price_formatted'] = 'Gratuito'
                        block_data['is_free'] = True

                    # Extract description
                    description = schema_data.get('description', '')
                    if description and len(description) > 500:
                        description = description[:497] + "..."
                    block_data['description'] = description if description else None

                except Exception as e:
                    self.logger.warning(f"Failed to parse JSON-LD for {url}: {e}")
                    return None
            else:
                # Fallback: Extract from HTML if no JSON-LD
                self.logger.warning(f"No JSON-LD found for {url}, trying HTML parsing")

                # Extract block name from h1
                h1_tag = soup.find('h1')
                if h1_tag:
                    block_data['name'] = h1_tag.get_text(strip=True)
                else:
                    self.logger.warning(f"No title found for {url}")
                    return None

                # Get page text for pattern matching
                page_text = soup.get_text()

                # Extract date and time
                date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', page_text)
                time_match = re.search(r'(\d{1,2}:\d{2})', page_text)

                if date_match:
                    block_data['date'] = parse_date(date_match.group(1))
                else:
                    self.logger.warning(f"No date found for {url}")
                    return None

                if time_match:
                    block_data['time'] = time_match.group(1)
                else:
                    block_data['time'] = '00:00'

                block_data['datetime'] = create_datetime_iso(block_data['date'], block_data['time'])

                # Try to find neighborhood and address
                block_data['neighborhood'] = 'Centro'
                block_data['address'] = None

                # Try to find price
                if 'gratuito' in page_text.lower() or 'grátis' in page_text.lower():
                    block_data['price'] = None
                    block_data['price_formatted'] = 'Gratuito'
                    block_data['is_free'] = True
                else:
                    block_data['price'] = None
                    block_data['price_formatted'] = None
                    block_data['is_free'] = True

                block_data['description'] = None

            # Validate required fields
            if not block_data.get('name') or not block_data.get('date'):
                self.logger.warning(f"Missing required fields for {url}")
                return None

            # Geocode the address
            geocode_query = block_data.get('address') or block_data['neighborhood']
            coordinates = self.geocoder.geocode(geocode_query, city)

            if coordinates:
                block_data['coordinates'] = list(coordinates)
                block_data['needs_geocoding'] = False
                self.stats['blocks_geocoded'] += 1
            else:
                self.logger.warning(f"Failed to geocode: {geocode_query}, {city}")
                # Save block anyway with null coordinates for later retry
                block_data['coordinates'] = None
                block_data['needs_geocoding'] = True
                block_data['geocoding_query'] = geocode_query
                self.stats['blocks_need_geocoding'] += 1

            self.stats['blocks_scraped'] += 1
            return block_data

        except Exception as e:
            self.logger.error(f"Error scraping {url}: {e}")
            self.stats['errors'] += 1
            return None

    def scrape_city(self, city_slug: str, city_config: Dict[str, str]) -> List[Dict[str, Any]]:
        """Scrape all blocks for a city."""
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Starting scrape for: {city_config['name']}")
        self.logger.info(f"{'='*60}\n")

        # Get all block URLs
        block_urls = self.get_all_block_urls_for_city(city_config['url'])
        self.stats['blocks_found'] += len(block_urls)

        # Scrape each block
        blocks = []
        for i, url in enumerate(block_urls, 1):
            self.logger.info(f"[{i}/{len(block_urls)}] Scraping block...")
            block_data = self.scrape_block_page(url, city_config['name'])

            if block_data:
                blocks.append(block_data)

            # Progress update every 10 blocks
            if i % 10 == 0:
                self.logger.info(f"Progress: {i}/{len(block_urls)} blocks processed")

        self.stats['cities_scraped'] += 1
        return blocks

    def save_city_data(self, city_slug: str, city_name: str, blocks: List[Dict[str, Any]]):
        """Save scraped data as GeoJSON."""
        if not blocks:
            self.logger.warning(f"No blocks to save for {city_name}")
            return

        # Create GeoJSON features
        features = [create_geojson_feature(block) for block in blocks]

        # Create FeatureCollection
        geojson = create_geojson_collection(features, city_name, city_slug)

        # Save to file
        output_dir = 'output'
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, f"{city_slug}.json")

        save_geojson(geojson, filepath)
        self.logger.info(f"✓ Saved {len(features)} blocks to {filepath}")

    def run(self, cities: Optional[List[str]] = None):
        """Run scraper for all or specific cities."""
        self.logger.info("🎭 CarnaMapa Scraper Started")
        self.logger.info(f"Rate limit: {self.requests_delay}s between requests\n")

        cities_to_scrape = cities or list(CITIES.keys())

        for city_slug in cities_to_scrape:
            if city_slug not in CITIES:
                self.logger.error(f"Unknown city: {city_slug}")
                continue

            city_config = CITIES[city_slug]

            try:
                blocks = self.scrape_city(city_slug, city_config)
                self.save_city_data(city_slug, city_config['name'], blocks)

            except Exception as e:
                self.logger.error(f"Failed to scrape {city_config['name']}: {e}")
                self.stats['errors'] += 1

        # Print final statistics
        self.print_stats()

    def print_stats(self):
        """Print scraping statistics."""
        geocoding_stats = self.geocoder.get_stats()

        self.logger.info("\n" + "="*60)
        self.logger.info("SCRAPING COMPLETE")
        self.logger.info("="*60)
        self.logger.info(f"Cities scraped:       {self.stats['cities_scraped']}")
        self.logger.info(f"Pages scraped:        {self.stats['pages_scraped']}")
        self.logger.info(f"Blocks found:         {self.stats['blocks_found']}")
        self.logger.info(f"Blocks scraped:       {self.stats['blocks_scraped']}")
        self.logger.info(f"Blocks geocoded:      {self.stats['blocks_geocoded']}")
        self.logger.info(f"Blocks need geocode:  {self.stats['blocks_need_geocoding']} ⚠️")
        self.logger.info(f"Errors:               {self.stats['errors']}")
        self.logger.info("\nGeocoding Stats:")
        self.logger.info(f"Total queries:        {geocoding_stats['total_queries']}")
        self.logger.info(f"Successful:           {geocoding_stats['successful']}")
        self.logger.info(f"Failed:               {geocoding_stats['failed']}")
        self.logger.info(f"Hit rate:             {geocoding_stats['hit_rate']}")
        if self.stats['blocks_need_geocoding'] > 0:
            self.logger.info(f"\n⚠️  {self.stats['blocks_need_geocoding']} blocks saved with null coordinates")
            self.logger.info("Run retry_geocoding.py with Google Maps API to fix them")
        self.logger.info("="*60)


def main():
    """Main entry point."""
    load_dotenv()

    # Get delay from environment or use default
    delay = float(os.getenv('REQUESTS_DELAY', '2.0'))

    # Initialize and run scraper
    scraper = CarnaMapaScraper(requests_delay=delay)

    # Check if specific cities are requested
    cities = sys.argv[1:] if len(sys.argv) > 1 else None

    if cities:
        print(f"Scraping specific cities: {', '.join(cities)}")
    else:
        print("Scraping all cities")

    scraper.run(cities)


if __name__ == '__main__':
    main()
