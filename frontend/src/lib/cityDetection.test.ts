import { describe, it, expect } from 'vitest';
import { detectCityFromCoords, haversineDistance } from './cityDetection';

describe('cityDetection', () => {
  describe('haversineDistance', () => {
    it('should calculate distance between two points', () => {
      // Rio de Janeiro to São Paulo is approximately 360km
      const rio: [number, number] = [-43.1729, -22.9068];
      const sp: [number, number] = [-46.6333, -23.5505];
      const distance = haversineDistance(rio, sp);

      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(400);
    });

    it('should return 0 for same point', () => {
      const point: [number, number] = [-43.1729, -22.9068];
      const distance = haversineDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('detectCityFromCoords', () => {
    it('should detect Rio de Janeiro from coordinates near the city', () => {
      // Coordinates near Copacabana
      const coords: [number, number] = [-43.1856, -22.9711];
      const city = detectCityFromCoords(coords);

      expect(city?.slug).toBe('rio-de-janeiro');
    });

    it('should detect São Paulo from coordinates near the city', () => {
      // Coordinates near Paulista Avenue
      const coords: [number, number] = [-46.6539, -23.5647];
      const city = detectCityFromCoords(coords);

      expect(city?.slug).toBe('sao-paulo');
    });

    it('should detect Belo Horizonte from coordinates near the city', () => {
      // Coordinates near Praça da Liberdade
      const coords: [number, number] = [-43.9366, -19.9305];
      const city = detectCityFromCoords(coords);

      expect(city?.slug).toBe('belo-horizonte');
    });

    it('should return null for coordinates far from any city', () => {
      // Coordinates in the Atlantic Ocean
      const coords: [number, number] = [-30.0, -15.0];
      const city = detectCityFromCoords(coords);

      expect(city).toBeNull();
    });

    it('should respect maxDistance parameter', () => {
      // Coordinates 50km from Rio
      const coords: [number, number] = [-43.5, -22.9];

      // Should find with default (100km)
      const cityDefault = detectCityFromCoords(coords);
      expect(cityDefault?.slug).toBe('rio-de-janeiro');

      // Should not find with 10km limit
      const cityNarrow = detectCityFromCoords(coords, 10);
      expect(cityNarrow).toBeNull();
    });
  });
});
