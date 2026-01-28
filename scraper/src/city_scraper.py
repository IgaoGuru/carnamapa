"""
CityScraper - Parallel scraping for individual cities.

This module handles concurrent scraping of event pages within a single city,
with skip logic for already-processed events.
"""

import json
import logging
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Any, Set

import requests
from bs4 import BeautifulSoup

from config import USER_AGENT, REQUESTS_TIMEOUT
from skip_checker import load_existing_event_ids, should_skip_event
from utils import extract_id_from_url, create_datetime_iso


class CityScraper:
    """
    Scraper for a single city with parallel event page fetching.

    Handles:
    - Paginated listing pages
    - Concurrent event page scraping (max 5 workers)
    - Skip logic for already-processed events
    - Partial results on errors (doesn't fail entire city)
    - Thread-safe logging with city prefix
    """

    # Max workers for concurrent event page fetches
    MAX_WORKERS = 5

    def __init__(self, city_name: str, city_url: str, city_slug: str, requests_delay: float = 2.0):
        """
        Initialize CityScraper for a specific city.

        Args:
            city_name: Display name of the city (e.g., 'São Paulo')
            city_url: Base URL for the city's listing page
            city_slug: URL-safe slug (e.g., 'sao-paulo')
            requests_delay: Delay between sequential requests (seconds)
        """
        self.city_name = city_name
        self.city_url = city_url
        self.city_slug = city_slug
        self.requests_delay = requests_delay

        # Thread-safe logging
        self._log_lock = threading.Lock()
        self.logger = logging.getLogger(f"scraper.{city_slug}")

        # Session per scraper (thread-local would be even safer for large pools)
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': USER_AGENT})

        # Stats tracking
        self.stats = {
            'events_found': 0,
            'events_skipped': 0,
            'events_scraped': 0,
            'errors': 0,
        }

    def _log(self, level: int, message: str) -> None:
        """Thread-safe logging with city prefix."""
        with self._log_lock:
            self.logger.log(level, f"[{self.city_slug}] {message}")

    def _make_request(self, url: str) -> Optional[BeautifulSoup]:
        """Make HTTP request with error handling."""
        try:
            time.sleep(self.requests_delay)  # Rate limiting
            self._log(logging.INFO, f"Fetching: {url}")

            response = self.session.get(url, timeout=REQUESTS_TIMEOUT)
            response.raise_for_status()

            return BeautifulSoup(response.content, 'html.parser')

        except requests.RequestException as e:
            self._log(logging.ERROR, f"Request failed for {url}: {e}")
            self.stats['errors'] += 1
            return None

    def _get_block_urls_from_page(self, soup: BeautifulSoup) -> List[str]:
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

    def _get_all_block_urls(self) -> List[str]:
        """Get all block URLs from paginated city listing."""
        all_urls = []
        page_num = 1

        while True:
            # First page has no /page/1, subsequent pages do
            if page_num == 1:
                page_url = self.city_url
            else:
                page_url = f"{self.city_url}/page/{page_num}/"

            soup = self._make_request(page_url)
            if not soup:
                break

            block_urls = self._get_block_urls_from_page(soup)

            if not block_urls:
                self._log(logging.INFO, f"No more blocks found on page {page_num}")
                break

            all_urls.extend(block_urls)
            self._log(logging.INFO, f"Page {page_num}: Found {len(block_urls)} blocks")

            # Check if there's a next page link
            next_link = soup.find('a', string=lambda s: s and 'Próximos' in s)
            if not next_link:
                break

            page_num += 1

        self._log(logging.INFO, f"Total blocks found: {len(all_urls)}")
        return all_urls

    def _scrape_event_page(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape individual block detail page using JSON-LD structured data.

        This method does NOT geocode - it just extracts the raw data.
        Geocoding is done in batch by the pipeline orchestrator.
        """
        soup = self._make_request(url)
        if not soup:
            return None

        try:
            block_data: Dict[str, Any] = {
                'id': extract_id_from_url(url),
                'source_url': url,
                'city': self.city_name,
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
                    self._log(logging.WARNING, f"Failed to parse JSON-LD for {url}: {e}")
                    return None
            else:
                # Fallback: Extract from HTML if no JSON-LD
                self._log(logging.WARNING, f"No JSON-LD found for {url}, trying HTML parsing")

                # Extract block name from h1
                h1_tag = soup.find('h1')
                if h1_tag:
                    block_data['name'] = h1_tag.get_text(strip=True)
                else:
                    self._log(logging.WARNING, f"No title found for {url}")
                    return None

                # Get page text for pattern matching
                page_text = soup.get_text()

                # Extract date and time
                date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', page_text)
                time_match = re.search(r'(\d{1,2}:\d{2})', page_text)

                if date_match:
                    # Parse date from DD/MM/YYYY format
                    date_str = date_match.group(1)
                    day, month, year = date_str.split('/')
                    block_data['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                else:
                    self._log(logging.WARNING, f"No date found for {url}")
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
                self._log(logging.WARNING, f"Missing required fields for {url}")
                return None

            # Store geocoding query for later batch processing
            # (actual geocoding is done by pipeline, not here)
            block_data['geocoding_query'] = block_data.get('address') or block_data['neighborhood']
            block_data['coordinates'] = None  # Will be filled by pipeline
            block_data['needs_geocoding'] = True  # Mark for geocoding

            return block_data

        except Exception as e:
            self._log(logging.ERROR, f"Error scraping {url}: {e}")
            self.stats['errors'] += 1
            return None

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape all events for this city.

        Returns:
            List of event dicts (may be empty if all events were skipped or failed)
        """
        self._log(logging.INFO, f"{'='*60}")
        self._log(logging.INFO, f"Starting scrape for: {self.city_name}")
        self._log(logging.INFO, f"{'='*60}")

        # Load existing event IDs to skip
        existing_ids = load_existing_event_ids(self.city_slug)
        if existing_ids:
            self._log(logging.INFO, f"Found {len(existing_ids)} existing events to potentially skip")

        # Get all block URLs
        all_urls = self._get_all_block_urls()
        self.stats['events_found'] = len(all_urls)

        if not all_urls:
            self._log(logging.WARNING, f"No events found for {self.city_name}")
            return []

        # Filter URLs to skip already-processed events
        urls_to_scrape: List[str] = []
        for url in all_urls:
            event_id = extract_id_from_url(url)
            if event_id and should_skip_event(event_id, existing_ids):
                self.stats['events_skipped'] += 1
            else:
                urls_to_scrape.append(url)

        if self.stats['events_skipped'] > 0:
            self._log(logging.INFO, f"Skipping {self.stats['events_skipped']} already-processed events")

        if not urls_to_scrape:
            self._log(logging.INFO, f"All events already processed for {self.city_name}")
            return []

        self._log(logging.INFO, f"Scraping {len(urls_to_scrape)} new events")

        # Scrape event pages in parallel
        events: List[Dict[str, Any]] = []
        completed = 0

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            # Submit all scrape tasks
            future_to_url = {
                executor.submit(self._scrape_event_page, url): url
                for url in urls_to_scrape
            }

            # Collect results as they complete
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                completed += 1

                try:
                    event_data = future.result()
                    if event_data:
                        events.append(event_data)
                        self.stats['events_scraped'] += 1
                except Exception as e:
                    self._log(logging.ERROR, f"Exception scraping {url}: {e}")
                    self.stats['errors'] += 1

                # Progress logging every 10 events or 10%
                if completed % 10 == 0 or completed == len(urls_to_scrape):
                    pct = (completed / len(urls_to_scrape)) * 100
                    self._log(logging.INFO, f"Progress: {completed}/{len(urls_to_scrape)} ({pct:.0f}%)")

        self._log(logging.INFO, f"Completed scraping {self.city_name}: "
                               f"{self.stats['events_scraped']} scraped, "
                               f"{self.stats['events_skipped']} skipped, "
                               f"{self.stats['errors']} errors")

        return events

    def get_stats(self) -> Dict[str, int]:
        """Return scraping statistics for this city."""
        return dict(self.stats)
