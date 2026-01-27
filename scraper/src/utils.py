"""
Utility functions for CarnaMapa scraper.
"""

import re
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from config import BRAZIL_BOUNDS, DEFAULT_TIMEZONE


def setup_logging(log_file: str = 'logs/scraper.log'):
    """Set up logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)


def extract_id_from_url(url: str) -> Optional[str]:
    """
    Extract block ID from URL.
    Example: https://www.blocosderua.com/programacao/alcione-sp-14-03-26/ -> alcione-sp-14-03-26
    """
    match = re.search(r'/programacao/([^/]+)/?$', url)
    return match.group(1) if match else None


def parse_date(date_str: str) -> Optional[str]:
    """
    Parse date string to ISO format (YYYY-MM-DD).
    Handles various Brazilian date formats.

    Examples:
    - "Sábado, 14 de Março de 2026" -> "2026-03-14"
    - "14/03/2026" -> "2026-03-14"
    - "14 de março" -> "2026-03-14" (assumes current year)
    """
    # Common month names in Portuguese
    months = {
        'janeiro': 1, 'jan': 1,
        'fevereiro': 2, 'fev': 2,
        'março': 3, 'mar': 3,
        'abril': 4, 'abr': 4,
        'maio': 5, 'mai': 5,
        'junho': 6, 'jun': 6,
        'julho': 7, 'jul': 7,
        'agosto': 8, 'ago': 8,
        'setembro': 9, 'set': 9,
        'outubro': 10, 'out': 10,
        'novembro': 11, 'nov': 11,
        'dezembro': 12, 'dez': 12,
    }

    date_str = date_str.lower().strip()

    # Try format: "14/03/2026" or "14/03/26"
    match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', date_str)
    if match:
        day, month, year = match.groups()
        year = int(year)
        if year < 100:
            year += 2000
        return f"{year:04d}-{int(month):02d}-{int(day):02d}"

    # Try format: "14 de março de 2026"
    match = re.search(r'(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?', date_str)
    if match:
        day, month_name, year = match.groups()
        month = months.get(month_name)
        if month:
            year = int(year) if year else 2026  # Default to 2026
            return f"{year:04d}-{month:02d}-{int(day):02d}"

    return None


def parse_time(time_str: str) -> Optional[str]:
    """
    Parse time string to HH:MM format.

    Examples:
    - "20:00" -> "20:00"
    - "8:00 PM" -> "20:00"
    - "14h" -> "14:00"
    """
    time_str = time_str.strip()

    # Format: "20:00"
    match = re.search(r'(\d{1,2}):(\d{2})', time_str)
    if match:
        hour, minute = match.groups()
        hour = int(hour)

        # Handle AM/PM
        if 'pm' in time_str.lower() and hour < 12:
            hour += 12
        elif 'am' in time_str.lower() and hour == 12:
            hour = 0

        return f"{hour:02d}:{minute}"

    # Format: "14h"
    match = re.search(r'(\d{1,2})h', time_str)
    if match:
        hour = int(match.group(1))
        return f"{hour:02d}:00"

    return None


def parse_price(price_str: str) -> Dict[str, Any]:
    """
    Parse price string and return structured data.

    Returns:
        {
            'price': float or None,
            'price_formatted': str or None,
            'is_free': bool
        }
    """
    price_str = price_str.lower().strip()

    # Check if free
    if any(word in price_str for word in ['gratuito', 'grátis', 'free', 'entrada franca']):
        return {
            'price': None,
            'price_formatted': 'Gratuito',
            'is_free': True
        }

    # Extract numeric price: "R$ 140,00" or "R$ 140.00"
    match = re.search(r'r?\$?\s*(\d+)[,.]?(\d{0,2})', price_str)
    if match:
        reais, centavos = match.groups()
        price = float(f"{reais}.{centavos.ljust(2, '0')}")
        price_formatted = f"R$ {reais},{centavos.ljust(2, '0')}"
        return {
            'price': price,
            'price_formatted': price_formatted,
            'is_free': False
        }

    return {
        'price': None,
        'price_formatted': None,
        'is_free': True
    }


def create_datetime_iso(date: str, time: str, timezone: str = DEFAULT_TIMEZONE) -> Optional[str]:
    """
    Create ISO 8601 datetime string.

    Args:
        date: Date in YYYY-MM-DD format
        time: Time in HH:MM format
        timezone: Timezone offset (default: -03:00 for BRT)

    Returns:
        ISO datetime string: "2026-03-14T20:00:00-03:00"
    """
    if not date or not time:
        return None

    return f"{date}T{time}:00{timezone}"


def validate_coordinates(lon: float, lat: float) -> bool:
    """
    Validate that coordinates are within Brazil's bounds.
    """
    return (
        BRAZIL_BOUNDS['min_lon'] <= lon <= BRAZIL_BOUNDS['max_lon'] and
        BRAZIL_BOUNDS['min_lat'] <= lat <= BRAZIL_BOUNDS['max_lat']
    )


def save_geojson(data: Dict[str, Any], filepath: str):
    """
    Save data as formatted GeoJSON file.
    """
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def create_geojson_feature(block_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a GeoJSON Feature from block data.
    Handles blocks with null coordinates (failed geocoding).
    """
    return {
        "type": "Feature",
        "id": block_data['id'],
        "geometry": {
            "type": "Point",
            "coordinates": block_data['coordinates']  # Can be null for failed geocoding
        },
        "properties": {
            "name": block_data['name'],
            "date": block_data['date'],
            "time": block_data['time'],
            "datetime": block_data['datetime'],
            "city": block_data['city'],
            "neighborhood": block_data['neighborhood'],
            "address": block_data.get('address'),
            "price": block_data.get('price'),
            "price_formatted": block_data.get('price_formatted'),
            "is_free": block_data.get('is_free', True),
            "description": block_data.get('description'),
            "source_url": block_data['source_url'],
            "needs_geocoding": block_data.get('needs_geocoding', False),
            "geocoding_query": block_data.get('geocoding_query')
        }
    }


def create_geojson_collection(features: list, city_name: str, city_slug: str) -> Dict[str, Any]:
    """
    Create a GeoJSON FeatureCollection with metadata.
    """
    return {
        "type": "FeatureCollection",
        "metadata": {
            "city": city_name,
            "city_slug": city_slug,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "total_blocks": len(features),
            "source": "blocosderua.com"
        },
        "features": features
    }
