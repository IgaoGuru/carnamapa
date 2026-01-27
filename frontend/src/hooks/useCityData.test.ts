import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCityData } from './useCityData';
import type { CityData } from '../lib/types';

describe('useCityData', () => {
  const mockCityData: CityData = {
    type: 'FeatureCollection',
    metadata: {
      city: 'Rio de Janeiro',
      city_slug: 'rio-de-janeiro',
      generated_at: '2026-01-27T10:00:00Z',
      total_blocks: 2,
      source: 'blocosderua.com',
    },
    features: [
      {
        type: 'Feature',
        id: 'bloco-1',
        geometry: {
          type: 'Point',
          coordinates: [-43.1729, -22.9068],
        },
        properties: {
          name: 'Bloco 1',
          date: '2026-02-28',
          time: '14:00',
          datetime: '2026-02-28T14:00:00-03:00',
          city: 'Rio de Janeiro',
          neighborhood: 'Copacabana',
          address: 'Av. Atlântica',
          price: null,
          price_formatted: null,
          is_free: true,
          description: 'Test block',
          source_url: 'https://blocosderua.com/bloco-1',
        },
      },
      {
        type: 'Feature',
        id: 'bloco-2',
        geometry: {
          type: 'Point',
          coordinates: null, // Block without coordinates
        },
        properties: {
          name: 'Bloco 2',
          date: '2026-02-28',
          time: '16:00',
          datetime: '2026-02-28T16:00:00-03:00',
          city: 'Rio de Janeiro',
          neighborhood: 'Ipanema',
          address: null,
          price: 50,
          price_formatted: 'R$ 50,00',
          is_free: false,
          description: null,
          source_url: 'https://blocosderua.com/bloco-2',
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial state when citySlug is null', () => {
    const { result } = renderHook(() => useCityData(null));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading true when fetching data', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useCityData('rio-de-janeiro'));

    expect(result.current.loading).toBe(true);
  });

  it('should load city data successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCityData),
    });

    const { result } = renderHook(() => useCityData('rio-de-janeiro'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.metadata.city).toBe('Rio de Janeiro');
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/data/rio-de-janeiro.json');
  });

  it('should filter out blocks without coordinates', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCityData),
    });

    const { result } = renderHook(() => useCityData('rio-de-janeiro'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only have 1 feature (bloco-2 has null coordinates)
    expect(result.current.data?.features).toHaveLength(1);
    expect(result.current.data?.features[0].id).toBe('bloco-1');
  });

  it('should set error when fetch fails with non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useCityData('unknown-city'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Dados da cidade não encontrados');
  });

  it('should set error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCityData('rio-de-janeiro'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('should clear data when citySlug changes to null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCityData),
    });

    const { result, rerender } = renderHook(
      ({ citySlug }) => useCityData(citySlug),
      { initialProps: { citySlug: 'rio-de-janeiro' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    rerender({ citySlug: null });

    expect(result.current.data).toBeNull();
  });

  it('should fetch new data when citySlug changes', async () => {
    const spData: CityData = {
      ...mockCityData,
      metadata: { ...mockCityData.metadata, city: 'São Paulo', city_slug: 'sao-paulo' },
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCityData),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(spData),
      });

    const { result, rerender } = renderHook(
      ({ citySlug }) => useCityData(citySlug),
      { initialProps: { citySlug: 'rio-de-janeiro' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.data?.metadata.city).toBe('Rio de Janeiro');
    });

    rerender({ citySlug: 'sao-paulo' });

    await waitFor(() => {
      expect(result.current.data?.metadata.city).toBe('São Paulo');
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, '/data/rio-de-janeiro.json');
    expect(fetch).toHaveBeenNthCalledWith(2, '/data/sao-paulo.json');
  });
});
