"""
Parallel geocoding pool for CarnaMapa scraper.
Handles concurrent geocoding requests with rate limiting.
"""

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Tuple

from geocoder import Geocoder
from config import (
    GEOCODING_NOMINATIM_CONCURRENCY,
    GEOCODING_GOOGLE_CONCURRENCY,
)


logger = logging.getLogger(__name__)


class GeocodingPool:
    """
    Parallel geocoding pool with rate limiting.

    Handles concurrent geocoding of multiple addresses while respecting
    Nominatim's 1 request/second rate limit and configurable Google concurrency.
    """

    def __init__(
        self,
        addresses: List[Tuple[str, str]],
        geocoder: Optional[Geocoder] = None
    ):
        """
        Initialize the geocoding pool.

        Args:
            addresses: List of (address, city) tuples to geocode
            geocoder: Optional existing Geocoder instance (creates new one if not provided)
        """
        self.addresses = addresses
        self.geocoder = geocoder or Geocoder()

        # Rate limiting for Nominatim (1 request per second)
        self._nominatim_lock = threading.Lock()
        self._last_nominatim_time = 0.0

        # Semaphore for Google concurrency
        self._google_semaphore = threading.Semaphore(GEOCODING_GOOGLE_CONCURRENCY)

        # Results storage (thread-safe)
        self._results: Dict[str, Optional[Tuple[float, float]]] = {}
        self._results_lock = threading.Lock()

        # Progress tracking
        self._completed = 0
        self._total = len(addresses)
        self._progress_lock = threading.Lock()

        logger.info(
            f"GeocodingPool initialized: {self._total} addresses, "
            f"Nominatim concurrency={GEOCODING_NOMINATIM_CONCURRENCY}, "
            f"Google concurrency={GEOCODING_GOOGLE_CONCURRENCY}"
        )

    def _create_address_key(self, address: str, city: str) -> str:
        """Create a unique key for an address/city pair."""
        return f"{address}|{city}"

    def _throttle_nominatim(self):
        """
        Enforce Nominatim rate limiting (1 request per second).

        This is required by OpenStreetMap's usage policy.
        """
        with self._nominatim_lock:
            current_time = time.time()
            time_since_last = current_time - self._last_nominatim_time

            if time_since_last < 1.0:
                sleep_time = 1.0 - time_since_last
                time.sleep(sleep_time)

            self._last_nominatim_time = time.time()

    def _geocode_address(self, address: str, city: str) -> Optional[Tuple[float, float]]:
        """
        Geocode a single address with rate limiting.

        Args:
            address: The street address
            city: The city name

        Returns:
            Tuple of (longitude, latitude) or None if geocoding fails
        """
        # The geocoder handles the fallback chain internally
        # We need to throttle Nominatim requests here
        self._throttle_nominatim()

        try:
            result = self.geocoder.geocode_with_fallback(address, city)
            return result
        except Exception as e:
            logger.error(f"Error geocoding {address}, {city}: {e}")
            return None

    def _process_address(self, address: str, city: str):
        """
        Process a single address and store the result.

        Args:
            address: The street address
            city: The city name
        """
        key = self._create_address_key(address, city)

        try:
            result = self._geocode_address(address, city)

            with self._results_lock:
                self._results[key] = result

        except Exception as e:
            logger.error(f"Failed to process {address}, {city}: {e}")
            with self._results_lock:
                self._results[key] = None

        # Update progress
        with self._progress_lock:
            self._completed += 1
            completed = self._completed
            total = self._total

        # Log progress every 10 addresses or 10% completion
        if completed % 10 == 0 or completed == total or (total > 0 and completed % max(1, total // 10) == 0):
            percent = (completed / total * 100) if total > 0 else 100
            logger.info(f"Geocoding progress: {completed}/{total} ({percent:.1f}%)")

    def geocode_all(self) -> Dict[str, Optional[Tuple[float, float]]]:
        """
        Geocode all addresses in parallel with rate limiting.

        Returns:
            Dict mapping "address|city" keys to (longitude, latitude) tuples or None
        """
        if not self.addresses:
            logger.info("No addresses to geocode")
            return {}

        logger.info(f"Starting parallel geocoding of {self._total} addresses")
        start_time = time.time()

        # Use ThreadPoolExecutor for parallel processing
        # Nominatim concurrency is controlled by rate limiting (1/sec)
        # We use a reasonable number of workers to handle both providers
        max_workers = max(GEOCODING_NOMINATIM_CONCURRENCY, GEOCODING_GOOGLE_CONCURRENCY)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all geocoding tasks
            futures = []
            for address, city in self.addresses:
                future = executor.submit(self._process_address, address, city)
                futures.append(future)

            # Wait for all tasks to complete
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Task failed: {e}")

        elapsed = time.time() - start_time

        # Count successes and failures
        successes = sum(1 for v in self._results.values() if v is not None)
        failures = len(self._results) - successes

        logger.info(
            f"Geocoding complete: {successes} succeeded, {failures} failed "
            f"in {elapsed:.1f}s ({self._total / elapsed:.1f} addr/sec if > 0)"
            if elapsed > 0 else f"Geocoding complete: {successes} succeeded, {failures} failed"
        )

        return self._results.copy()

    def get_results_by_address(self) -> Dict[Tuple[str, str], Optional[Tuple[float, float]]]:
        """
        Get results keyed by (address, city) tuples instead of string keys.

        Returns:
            Dict mapping (address, city) tuples to coordinates or None
        """
        result = {}
        for key, coords in self._results.items():
            if '|' in key:
                address, city = key.split('|', 1)
                result[(address, city)] = coords
        return result
