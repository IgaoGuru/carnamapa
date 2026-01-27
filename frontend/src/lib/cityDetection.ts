import { CITIES } from './cities';
import type { CityConfig } from './types';

// Haversine distance in km
function haversineDistance(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city within threshold (default 100km)
export function detectCityFromCoords(
  coords: [number, number],
  maxDistance = 100
): CityConfig | null {
  let nearest: CityConfig | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const distance = haversineDistance(coords, city.center);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}

// Export haversine for testing
export { haversineDistance };
