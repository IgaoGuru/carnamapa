import { useCallback } from 'react';

interface UrlParams {
  city?: string;
  date?: string;
  free?: string;  // "1" for free only filter
  block?: string;
  blocos?: string; // Comma-separated list of block IDs for sharing
}

export function useUrlParams() {
  const getParams = useCallback((): UrlParams => {
    const params = new URLSearchParams(window.location.search);
    return {
      city: params.get('city') || undefined,
      date: params.get('date') || undefined,
      free: params.get('free') || undefined,
      block: params.get('block') || undefined,
      blocos: params.get('blocos') || undefined,
    };
  }, []);

  const setParams = useCallback((newParams: Partial<UrlParams>) => {
    const params = new URLSearchParams(window.location.search);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, []);

  return { getParams, setParams };
}
