"""
Geocoding module for CarnaMapa scraper.
Converts addresses to latitude/longitude coordinates.
"""

import os
import json
import logging
import time
from typing import Optional, Tuple
from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from utils import validate_coordinates


logger = logging.getLogger(__name__)


class Geocoder:
    """
    Geocoder with caching support.
    Supports Nominatim (free, no API key) and Google Maps Geocoding API.
    """

    def __init__(self, cache_file: str = 'cache/geocoding_cache.json'):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.geocoder = self._initialize_geocoder()

    def _load_cache(self) -> dict:
        """Load geocoding cache from file."""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load cache: {e}")
        return {}

    def _save_cache(self):
        """Save geocoding cache to file."""
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save cache: {e}")

    def _initialize_geocoder(self):
        """Initialize geocoder based on available API keys."""
        google_key = os.getenv('GOOGLE_MAPS_API_KEY')

        if google_key:
            logger.info("Using Google Maps Geocoding API")
            return GoogleV3(api_key=google_key, timeout=10)
        else:
            logger.info("Using Nominatim (OpenStreetMap) - free but rate-limited")
            return Nominatim(user_agent="CarnaMapa/1.0", timeout=10)

    def _simplify_address(self, address: str) -> str:
        """Simplify address by removing extra details that confuse geocoders."""
        import re

        # Remove everything in parentheses
        address = re.sub(r'\([^)]*\)', '', address)

        # Remove state codes (SP, RJ, etc.)
        address = re.sub(r',\s*[A-Z]{2}\s*,', ',', address)

        # Remove zip codes (Brazilian format: 12345-678)
        address = re.sub(r'\d{5}-?\d{3}', '', address)

        # Remove "Brasil"
        address = address.replace(', Brasil', '').replace(',Brasil', '')

        # Clean up extra commas and spaces
        address = re.sub(r',\s*,', ',', address)
        address = re.sub(r'\s+', ' ', address)

        return address.strip().strip(',').strip()

    def geocode(self, address: str, city: str, max_retries: int = 3) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to coordinates [longitude, latitude].

        Args:
            address: Street address or neighborhood
            city: City name
            max_retries: Number of retry attempts

        Returns:
            Tuple of (longitude, latitude) or None if geocoding fails
        """
        # Simplify the address for better geocoding results
        simplified_address = self._simplify_address(address)

        # Create query - try simplified version first
        query = f"{simplified_address}, {city}, Brazil"
        cache_key = query.lower().strip()

        # Check cache first
        if cache_key in self.cache:
            logger.debug(f"Cache hit for: {query}")
            coords = self.cache[cache_key]
            return tuple(coords) if coords else None

        # Geocode with retries
        for attempt in range(max_retries):
            try:
                logger.info(f"Geocoding: {query} (attempt {attempt + 1}/{max_retries})")
                location = self.geocoder.geocode(query)

                if location:
                    lon, lat = location.longitude, location.latitude

                    # Validate coordinates are in Brazil
                    if validate_coordinates(lon, lat):
                        logger.info(f"✓ Geocoded: {query} -> [{lon}, {lat}]")
                        self.cache[cache_key] = [lon, lat]
                        self._save_cache()
                        return (lon, lat)
                    else:
                        logger.warning(f"✗ Coordinates outside Brazil: {query} -> [{lon}, {lat}]")

            except GeocoderTimedOut:
                logger.warning(f"Timeout geocoding: {query}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue

            except GeocoderServiceError as e:
                logger.error(f"Geocoding service error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue

            except Exception as e:
                logger.error(f"Unexpected error geocoding {query}: {e}")
                break

        # Try fallback: just neighborhood + city
        if ',' in simplified_address:
            # Extract what looks like a neighborhood (usually last part before city)
            parts = [p.strip() for p in simplified_address.split(',')]
            if len(parts) > 1:
                neighborhood = parts[-1] if not any(char.isdigit() for char in parts[-1]) else parts[0]
                fallback_query = f"{neighborhood}, {city}, Brazil"
                fallback_cache_key = fallback_query.lower().strip()

                if fallback_cache_key not in self.cache:
                    logger.info(f"Trying fallback: {fallback_query}")
                    try:
                        location = self.geocoder.geocode(fallback_query)
                        if location:
                            lon, lat = location.longitude, location.latitude
                            if validate_coordinates(lon, lat):
                                logger.info(f"✓ Geocoded (fallback): {fallback_query} -> [{lon}, {lat}]")
                                self.cache[cache_key] = [lon, lat]
                                self.cache[fallback_cache_key] = [lon, lat]
                                self._save_cache()
                                return (lon, lat)
                    except Exception as e:
                        logger.warning(f"Fallback geocoding failed: {e}")

        # Cache the failure
        logger.warning(f"✗ No results for: {query}")
        self.cache[cache_key] = None
        self._save_cache()
        return None

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = len(self.cache)
        hits = sum(1 for v in self.cache.values() if v is not None)
        misses = total - hits

        return {
            'total_queries': total,
            'successful': hits,
            'failed': misses,
            'hit_rate': f"{(hits/total*100):.1f}%" if total > 0 else "0%"
        }
