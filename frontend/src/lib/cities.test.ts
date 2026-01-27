import { describe, it, expect } from 'vitest';
import { CITIES, getCityBySlug, getCityByName } from './cities';

describe('cities', () => {
  describe('CITIES', () => {
    it('should have 9 cities', () => {
      expect(CITIES).toHaveLength(9);
    });

    it('should include Rio de Janeiro', () => {
      const rio = CITIES.find(c => c.slug === 'rio-de-janeiro');
      expect(rio).toBeDefined();
      expect(rio?.name).toBe('Rio de Janeiro');
    });

    it('should include São Paulo', () => {
      const sp = CITIES.find(c => c.slug === 'sao-paulo');
      expect(sp).toBeDefined();
      expect(sp?.name).toBe('São Paulo');
    });

    it('should include Belo Horizonte', () => {
      const bh = CITIES.find(c => c.slug === 'belo-horizonte');
      expect(bh).toBeDefined();
      expect(bh?.name).toBe('Belo Horizonte');
    });

    it('should have valid coordinates for all cities', () => {
      CITIES.forEach(city => {
        expect(city.center).toHaveLength(2);
        expect(city.center[0]).toBeGreaterThanOrEqual(-74);
        expect(city.center[0]).toBeLessThanOrEqual(-32);
        expect(city.center[1]).toBeGreaterThanOrEqual(-34);
        expect(city.center[1]).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('getCityBySlug', () => {
    it('should return city by slug', () => {
      const city = getCityBySlug('rio-de-janeiro');
      expect(city?.name).toBe('Rio de Janeiro');
    });

    it('should return undefined for unknown slug', () => {
      const city = getCityBySlug('unknown-city');
      expect(city).toBeUndefined();
    });
  });

  describe('getCityByName', () => {
    it('should return city by name', () => {
      const city = getCityByName('São Paulo');
      expect(city?.slug).toBe('sao-paulo');
    });

    it('should return undefined for unknown name', () => {
      const city = getCityByName('Unknown City');
      expect(city).toBeUndefined();
    });
  });
});
