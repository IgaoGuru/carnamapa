"""
Skip checker module for avoiding re-processing already scraped events.
"""

import json
import os
from typing import Set, Optional


def load_existing_event_ids(city_slug: str) -> Set[str]:
    """
    Load existing event IDs from the output JSON file for a city.

    Returns a set of event IDs that have valid coordinates (geometry.coordinates is not null).
    Handles missing output files gracefully by returning an empty set.

    Args:
        city_slug: The city slug (e.g., 'sao-paulo', 'rio-de-janeiro')

    Returns:
        Set of event IDs with valid coordinates
    """
    # Construct the path to the output file
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
    filepath = os.path.join(output_dir, f"{city_slug}.json")

    # Handle missing files gracefully
    if not os.path.exists(filepath):
        return set()

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract event IDs where geometry.coordinates is not null
        event_ids: Set[str] = set()

        features = data.get('features', [])
        for feature in features:
            event_id = feature.get('id')
            geometry = feature.get('geometry', {})
            coordinates = geometry.get('coordinates') if geometry else None

            # Only include events with valid coordinates (not null/None)
            if event_id and coordinates is not None:
                event_ids.add(event_id)

        return event_ids

    except (json.JSONDecodeError, IOError, KeyError):
        # Return empty set on any file reading/parsing errors
        return set()


def should_skip_event(event_id: str, existing_ids: Set[str]) -> bool:
    """
    Check if an event should be skipped because it was already processed.

    Args:
        event_id: The ID of the event to check
        existing_ids: Set of already processed event IDs (from load_existing_event_ids)

    Returns:
        True if the event should be skipped, False otherwise
    """
    return event_id in existing_ids
