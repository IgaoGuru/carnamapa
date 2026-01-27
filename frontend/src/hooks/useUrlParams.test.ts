import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlParams } from './useUrlParams';

describe('useUrlParams', () => {
  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState({}, '', '/');
  });

  describe('getParams', () => {
    it('should return empty object when no params', () => {
      const { result } = renderHook(() => useUrlParams());
      const params = result.current.getParams();

      expect(params.city).toBeUndefined();
      expect(params.date).toBeUndefined();
      expect(params.free).toBeUndefined();
      expect(params.block).toBeUndefined();
    });

    it('should return city param when set', () => {
      window.history.replaceState({}, '', '/?city=rio-de-janeiro');
      const { result } = renderHook(() => useUrlParams());
      const params = result.current.getParams();

      expect(params.city).toBe('rio-de-janeiro');
    });

    it('should return all params when set', () => {
      window.history.replaceState({}, '', '/?city=sao-paulo&date=2026-02-28&free=1&block=bloco-123');
      const { result } = renderHook(() => useUrlParams());
      const params = result.current.getParams();

      expect(params.city).toBe('sao-paulo');
      expect(params.date).toBe('2026-02-28');
      expect(params.free).toBe('1');
      expect(params.block).toBe('bloco-123');
    });
  });

  describe('setParams', () => {
    it('should set city param', () => {
      const { result } = renderHook(() => useUrlParams());

      act(() => {
        result.current.setParams({ city: 'belo-horizonte' });
      });

      expect(window.location.search).toBe('?city=belo-horizonte');
    });

    it('should set multiple params', () => {
      const { result } = renderHook(() => useUrlParams());

      act(() => {
        result.current.setParams({ city: 'salvador', date: '2026-03-01', free: '1' });
      });

      const params = new URLSearchParams(window.location.search);
      expect(params.get('city')).toBe('salvador');
      expect(params.get('date')).toBe('2026-03-01');
      expect(params.get('free')).toBe('1');
    });

    it('should remove param when set to undefined', () => {
      window.history.replaceState({}, '', '/?city=rio-de-janeiro&date=2026-02-28');
      const { result } = renderHook(() => useUrlParams());

      act(() => {
        result.current.setParams({ date: undefined });
      });

      const params = new URLSearchParams(window.location.search);
      expect(params.get('city')).toBe('rio-de-janeiro');
      expect(params.get('date')).toBeNull();
    });

    it('should clear URL when all params removed', () => {
      window.history.replaceState({}, '', '/?city=rio-de-janeiro');
      const { result } = renderHook(() => useUrlParams());

      act(() => {
        result.current.setParams({ city: undefined });
      });

      expect(window.location.search).toBe('');
    });

    it('should preserve existing params when setting new ones', () => {
      window.history.replaceState({}, '', '/?city=rio-de-janeiro');
      const { result } = renderHook(() => useUrlParams());

      act(() => {
        result.current.setParams({ date: '2026-02-28' });
      });

      const params = new URLSearchParams(window.location.search);
      expect(params.get('city')).toBe('rio-de-janeiro');
      expect(params.get('date')).toBe('2026-02-28');
    });
  });
});
