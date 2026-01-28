"""
Address normalization module for CarnaMapa scraper.
Cleans and normalizes Brazilian street addresses for better geocoding results.
"""

import re
from typing import Optional


def normalize_address(address: str, city: str) -> str:
    """
    Normalize a Brazilian address for geocoding.

    Args:
        address: Raw street address
        city: City name (used for context)

    Returns:
        Cleaned address string optimized for geocoding
    """
    if not address:
        return ""

    normalized = address

    # Remove parenthetical notes like '(Zona Sul)' or '(próximo ao metrô)'
    normalized = re.sub(r'\([^)]*\)', '', normalized)

    # Remove zip codes (Brazilian formats: 04784-145, 04784145, 04784 145)
    # Pattern matches 5 digits optionally followed by dash/space and 3 more digits
    normalized = re.sub(r'\b\d{5}[-\s]?\d{3}\b', '', normalized)
    # Also match standalone 8-digit zip codes without separator
    normalized = re.sub(r'\b\d{8}\b', '', normalized)

    # Remove 'Brasil' suffix (various formats)
    normalized = re.sub(r',?\s*Brasil\s*$', '', normalized, flags=re.IGNORECASE)

    # Handle 's/n' and 'S/N' (sem número / no number) - remove them
    normalized = re.sub(r'\b[sS]/[nN]\b', '', normalized)
    normalized = re.sub(r'\bsem\s+n[úu]mero\b', '', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\bs\.n\.?\b', '', normalized, flags=re.IGNORECASE)

    # Normalize common neighborhood variations
    # 'Centro Histórico' -> 'Centro' (more likely to geocode)
    normalized = re.sub(r'\bCentro\s+Hist[óo]rico\b', 'Centro', normalized, flags=re.IGNORECASE)

    # Remove state codes (SP, RJ, MG, etc.) that appear alone
    normalized = re.sub(r',\s*[A-Z]{2}\s*(?=,|$)', '', normalized)

    # Remove common noise words that don't help geocoding
    normalized = re.sub(r'\b(?:próximo|perto|ao lado|em frente|esquina)\s+(?:de?|ao?|da?|do?)?\s*', '', normalized, flags=re.IGNORECASE)

    # Clean up multiple spaces, commas
    normalized = re.sub(r',\s*,', ',', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    normalized = re.sub(r',\s*$', '', normalized)
    normalized = re.sub(r'^\s*,', '', normalized)

    # Final trim
    normalized = normalized.strip().strip(',').strip()

    return normalized


def extract_landmark(address: str) -> Optional[str]:
    """
    Extract a landmark or notable place name from an address for backup geocoding queries.

    This is useful when the full address fails to geocode - we can try just
    the landmark name + city.

    Args:
        address: The original address string

    Returns:
        Extracted landmark name or None if no landmark found
    """
    if not address:
        return None

    # Common landmark patterns in Brazilian addresses
    # Look for text in parentheses first (often contains landmarks)
    parens_match = re.search(r'\(([^)]+)\)', address)
    if parens_match:
        content = parens_match.group(1).strip()
        # Filter out generic notes like "Zona Sul", "próximo ao metrô"
        if not re.match(r'^(?:Zona|próximo|perto|ao lado|em frente)', content, re.IGNORECASE):
            # If it looks like a place name, return it
            if len(content) > 3 and not content.isdigit():
                return content

    # Look for common landmark prefixes
    landmark_patterns = [
        r'\b(?:Praça|Praca)\s+(?:de?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Praça da Sé, Praça República
        r'\b(?:Parque)\s+(?:de?\s+|do?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Parque Ibirapuera
        r'\b(?:Largo)\s+(?:de?\s+|do?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Largo da Batata
        r'\b(?:Estação)\s+([A-Za-zÀ-ÿ\s]+)',  # Estação da Luz
        r'\b(?:Shopping)\s+([A-Za-zÀ-ÿ\s]+)',  # Shopping Ibirapuera
        r'\b(?:Mercado)\s+(?:de?\s+|do?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Mercado Municipal
        r'\b(?:Teatro)\s+([A-Za-zÀ-ÿ\s]+)',  # Teatro Municipal
        r'\b(?:Igreja)\s+(?:de?\s+|da?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Igreja da Consolação
        r'\b(?:Viaduto)\s+(?:do?\s+)?([A-Za-zÀ-ÿ\s]+)',  # Viaduto do Chá
        r'\b(?:Avenida|Av\.?)\s+([A-Za-zÀ-ÿ\s]+)',  # Major avenues are landmarks
    ]

    for pattern in landmark_patterns:
        match = re.search(pattern, address, re.IGNORECASE)
        if match:
            # Return the full landmark including prefix
            full_match = match.group(0).strip()
            # Clean up trailing commas or numbers
            full_match = re.sub(r'[,\d]+$', '', full_match).strip()
            if len(full_match) > 5:  # Minimum reasonable landmark length
                return full_match

    return None
