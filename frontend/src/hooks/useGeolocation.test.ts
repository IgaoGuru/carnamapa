import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

describe('useGeolocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.requestLocation).toBe('function');
  });

  it('should set loading to true when requesting location', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Simulate pending request
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set coords on successful geolocation', async () => {
    const mockPosition = {
      coords: {
        latitude: -22.9068,
        longitude: -43.1729,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((successCallback) => {
      successCallback(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    await waitFor(() => {
      expect(result.current.coords).toEqual([-43.1729, -22.9068]); // [lng, lat]
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set error on permission denied', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    await waitFor(() => {
      expect(result.current.coords).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Permissão de localização negada');
    });
  });

  it('should set error on position unavailable', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Localização indisponível');
    });
  });

  it('should set error on timeout', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Tempo limite excedido');
    });
  });

  it('should set error when geolocation not supported', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.error).toBe('Geolocalização não suportada pelo navegador');
    expect(result.current.loading).toBe(false);
  });
});
