import { useCallback } from 'react';

interface UrlParams {
  city?: string;
  date?: string;
  block?: string;
}

export function useUrlParams() {
  const getParams = useCallback((): UrlParams => {
    const params = new URLSearchParams(window.location.search);
    return {
      city: params.get('city') || undefined,
      date: params.get('date') || undefined,
      block: params.get('block') || undefined,
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
