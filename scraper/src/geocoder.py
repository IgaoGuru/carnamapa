"""
Geocoding module for CarnaMapa scraper.
Converts addresses to latitude/longitude coordinates.
Supports fallback chain: Nominatim -> Google Maps API.
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from utils import validate_coordinates
from address_normalizer import normalize_address, extract_landmark
from config import (
    GOOGLE_MAPS_API_KEY,
    GEOCODING_GOOGLE_ENABLED,
)


logger = logging.getLogger(__name__)


class Geocoder:
    """
    Geocoder with caching support and fallback chain.
    Supports Nominatim (free, no API key) and Google Maps Geocoding API.
    """

    def __init__(self, cache_file: str = 'cache/geocoding_cache.json'):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self._nominatim = Nominatim(user_agent="CarnaMapa/1.0", timeout=10)
        self._google: Optional[GoogleV3] = None
        if GOOGLE_MAPS_API_KEY and GEOCODING_GOOGLE_ENABLED:
            self._google = GoogleV3(api_key=GOOGLE_MAPS_API_KEY, timeout=10)
            logger.info("Google Maps Geocoding API enabled")
        else:
            logger.info("Google Maps Geocoding API disabled (no key or disabled in config)")

        # Keep legacy geocoder for backward compatibility
        self.geocoder = self._google if self._google else self._nominatim

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

    def _try_geocode(self, geocoder: Any, query: str, provider_name: str) -> Optional[Tuple[float, float]]:
        """
        Try to geocode a query with a specific provider.

        Args:
            geocoder: The geocoder instance (Nominatim or GoogleV3)
            query: The address query string
            provider_name: Name for logging ('nominatim' or 'google')

        Returns:
            Tuple of (longitude, latitude) or None if geocoding fails
        """
        if geocoder is None:
            return None

        try:
            logger.debug(f"Trying {provider_name}: {query}")
            location = geocoder.geocode(query)

            if location:
                lon, lat = location.longitude, location.latitude

                # Validate coordinates are in Brazil
                if validate_coordinates(lon, lat):
                    logger.info(f"✓ {provider_name}: {query} -> [{lon}, {lat}]")
                    return (lon, lat)
                else:
                    logger.warning(f"✗ {provider_name}: Coordinates outside Brazil: {query} -> [{lon}, {lat}]")
            else:
                logger.debug(f"✗ {provider_name}: No results for: {query}")

        except GeocoderTimedOut:
            logger.warning(f"Timeout from {provider_name} for: {query}")
        except GeocoderServiceError as e:
            logger.warning(f"Service error from {provider_name}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error from {provider_name} geocoding {query}: {e}")

        return None

    def _create_simplified_query(self, address: str, city: str) -> Optional[str]:
        """
        Create a simplified query using neighborhood/landmark + city.

        Args:
            address: The original address
            city: The city name

        Returns:
            Simplified query string or None if cannot simplify
        """
        # First try to extract a landmark
        landmark = extract_landmark(address)
        if landmark:
            return f"{landmark}, {city}, Brazil"

        # Otherwise try to extract neighborhood (last part that's not a number)
        if ',' in address:
            parts = [p.strip() for p in address.split(',')]
            for part in reversed(parts):
                # Skip parts that are just numbers (addresses/zip codes)
                if part and not any(char.isdigit() for char in part):
                    return f"{part}, {city}, Brazil"

        return None

    def _cache_result(
        self,
        cache_key: str,
        coords: Optional[Tuple[float, float]],
        provider: Optional[str]
    ):
        """
        Cache a geocoding result with provider metadata.

        Args:
            cache_key: The cache key (normalized query)
            coords: Tuple of (longitude, latitude) or None for failures
            provider: Provider name ('nominatim', 'google', or None for failures)
        """
        timestamp = datetime.utcnow().isoformat() + "Z"

        if coords:
            self.cache[cache_key] = {
                'coords': list(coords),
                'provider': provider,
                'timestamp': timestamp
            }
        else:
            self.cache[cache_key] = {
                'coords': None,
                'provider': None,
                'timestamp': timestamp
            }

        self._save_cache()

    def _get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached result if it exists.

        Returns cached data dict with 'coords', 'provider', 'timestamp' or None.
        Also handles legacy cache format (just coords array).
        """
        if cache_key not in self.cache:
            return None

        cached = self.cache[cache_key]

        # Handle legacy format: just [lon, lat] or None
        if cached is None or isinstance(cached, list):
            return {
                'coords': cached,
                'provider': 'legacy',
                'timestamp': None
            }

        # New format: {'coords': [...], 'provider': '...', 'timestamp': '...'}
        return cached

    def geocode_with_fallback(self, address: str, city: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address using a fallback chain for maximum success rate.

        Fallback chain:
        1. Nominatim with normalized full address
        2. Google Maps API with normalized full address (if enabled)
        3. Nominatim with simplified query (neighborhood + city)
        4. Google Maps API with simplified query (if enabled)

        Args:
            address: Street address or location description
            city: City name

        Returns:
            Tuple of (longitude, latitude) or None if all providers fail
        """
        # Normalize the address for better geocoding results
        normalized = normalize_address(address, city)
        full_query = f"{normalized}, {city}, Brazil"
        cache_key = full_query.lower().strip()

        # Check cache first
        cached = self._get_cached_result(cache_key)
        if cached:
            coords = cached['coords']
            provider = cached['provider']
            if coords:
                logger.debug(f"Cache hit ({provider}): {full_query}")
                return tuple(coords)
            else:
                # Previously failed - but we might want to retry with Google
                # if it failed with Nominatim only
                if provider == 'nominatim' and self._google:
                    logger.debug(f"Cache shows Nominatim failure, will try Google: {full_query}")
                else:
                    logger.debug(f"Cache hit (failed): {full_query}")
                    return None

        # Step 1: Try Nominatim with full normalized address
        logger.info(f"Geocoding: {full_query}")
        coords = self._try_geocode(self._nominatim, full_query, 'nominatim')
        if coords:
            self._cache_result(cache_key, coords, 'nominatim')
            return coords

        # Rate limit: Nominatim requires 1 request/second
        time.sleep(1)

        # Step 2: Try Google Maps with full normalized address
        if self._google:
            coords = self._try_geocode(self._google, full_query, 'google')
            if coords:
                self._cache_result(cache_key, coords, 'google')
                return coords

        # Step 3: Try simplified query (neighborhood/landmark + city)
        simplified_query = self._create_simplified_query(normalized, city)
        if simplified_query:
            simplified_cache_key = simplified_query.lower().strip()

            # Check if simplified query is cached
            cached_simplified = self._get_cached_result(simplified_cache_key)
            if cached_simplified and cached_simplified['coords']:
                logger.info(f"✓ Cache hit (simplified): {simplified_query}")
                coords = tuple(cached_simplified['coords'])
                # Also cache under original key
                self._cache_result(cache_key, coords, cached_simplified['provider'])
                return coords

            # Try Nominatim with simplified query
            logger.info(f"Trying simplified: {simplified_query}")
            coords = self._try_geocode(self._nominatim, simplified_query, 'nominatim')
            if coords:
                self._cache_result(cache_key, coords, 'nominatim')
                self._cache_result(simplified_cache_key, coords, 'nominatim')
                return coords

            # Rate limit
            time.sleep(1)

            # Step 4: Try Google with simplified query
            if self._google:
                coords = self._try_geocode(self._google, simplified_query, 'google')
                if coords:
                    self._cache_result(cache_key, coords, 'google')
                    self._cache_result(simplified_cache_key, coords, 'google')
                    return coords

        # All attempts failed
        logger.warning(f"✗ All geocoding attempts failed for: {address}, {city}")
        self._cache_result(cache_key, None, None)
        return None

    def geocode_with_google_only(self, address: str, city: str) -> Optional[Tuple[float, float]]:
        """
        Geocode using only Google Maps API (for retry scenarios).

        This is useful when Nominatim has already failed and we want to
        retry with Google only (e.g., --retry-failed flag).

        Args:
            address: Street address or location description
            city: City name

        Returns:
            Tuple of (longitude, latitude) or None if geocoding fails
        """
        if not self._google:
            logger.warning("Google Maps API not available for retry")
            return None

        # Normalize the address
        normalized = normalize_address(address, city)
        full_query = f"{normalized}, {city}, Brazil"
        cache_key = full_query.lower().strip()

        # Try Google with full query
        coords = self._try_geocode(self._google, full_query, 'google')
        if coords:
            self._cache_result(cache_key, coords, 'google')
            return coords

        # Try simplified query
        simplified_query = self._create_simplified_query(normalized, city)
        if simplified_query:
            coords = self._try_geocode(self._google, simplified_query, 'google')
            if coords:
                self._cache_result(cache_key, coords, 'google')
                return coords

        return None

    # Legacy method for backward compatibility
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
        Legacy geocode method - now delegates to geocode_with_fallback.

        Kept for backward compatibility with existing code.

        Args:
            address: Street address or neighborhood
            city: City name
            max_retries: Number of retry attempts (ignored, kept for API compatibility)

        Returns:
            Tuple of (longitude, latitude) or None if geocoding fails
        """
        return self.geocode_with_fallback(address, city)

    def get_stats(self) -> dict:
        """Get cache statistics including provider breakdown."""
        total = len(self.cache)
        hits = 0
        nominatim_hits = 0
        google_hits = 0
        legacy_hits = 0
        failures = 0

        for value in self.cache.values():
            if value is None:
                failures += 1
            elif isinstance(value, list):
                # Legacy format
                hits += 1
                legacy_hits += 1
            elif isinstance(value, dict):
                if value.get('coords'):
                    hits += 1
                    provider = value.get('provider')
                    if provider == 'nominatim':
                        nominatim_hits += 1
                    elif provider == 'google':
                        google_hits += 1
                    elif provider == 'legacy':
                        legacy_hits += 1
                else:
                    failures += 1

        return {
            'total_queries': total,
            'successful': hits,
            'failed': failures,
            'nominatim_hits': nominatim_hits,
            'google_hits': google_hits,
            'legacy_hits': legacy_hits,
            'hit_rate': f"{(hits/total*100):.1f}%" if total > 0 else "0%"
        }
