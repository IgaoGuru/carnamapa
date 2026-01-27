import { describe, it, expect } from 'vitest';
import { isTimeInPeriod, TIME_PERIODS } from './types';

describe('isTimeInPeriod', () => {
  describe('manha (06:00 - 11:59)', () => {
    it('should return true for 06:00', () => {
      expect(isTimeInPeriod('06:00', 'manha')).toBe(true);
    });

    it('should return true for 09:30', () => {
      expect(isTimeInPeriod('09:30', 'manha')).toBe(true);
    });

    it('should return true for 11:59', () => {
      expect(isTimeInPeriod('11:59', 'manha')).toBe(true);
    });

    it('should return false for 05:59 (before manha)', () => {
      expect(isTimeInPeriod('05:59', 'manha')).toBe(false);
    });

    it('should return false for 12:00 (start of tarde)', () => {
      expect(isTimeInPeriod('12:00', 'manha')).toBe(false);
    });

    it('should return false for 14:00', () => {
      expect(isTimeInPeriod('14:00', 'manha')).toBe(false);
    });
  });

  describe('tarde (12:00 - 17:59)', () => {
    it('should return true for 12:00', () => {
      expect(isTimeInPeriod('12:00', 'tarde')).toBe(true);
    });

    it('should return true for 15:30', () => {
      expect(isTimeInPeriod('15:30', 'tarde')).toBe(true);
    });

    it('should return true for 17:59', () => {
      expect(isTimeInPeriod('17:59', 'tarde')).toBe(true);
    });

    it('should return false for 11:59 (end of manha)', () => {
      expect(isTimeInPeriod('11:59', 'tarde')).toBe(false);
    });

    it('should return false for 18:00 (start of noite)', () => {
      expect(isTimeInPeriod('18:00', 'tarde')).toBe(false);
    });

    it('should return false for 08:00', () => {
      expect(isTimeInPeriod('08:00', 'tarde')).toBe(false);
    });
  });

  describe('noite (18:00 - 05:59, wraps midnight)', () => {
    it('should return true for 18:00', () => {
      expect(isTimeInPeriod('18:00', 'noite')).toBe(true);
    });

    it('should return true for 21:00', () => {
      expect(isTimeInPeriod('21:00', 'noite')).toBe(true);
    });

    it('should return true for 23:59', () => {
      expect(isTimeInPeriod('23:59', 'noite')).toBe(true);
    });

    it('should return true for 00:00 (midnight)', () => {
      expect(isTimeInPeriod('00:00', 'noite')).toBe(true);
    });

    it('should return true for 02:00 (early morning)', () => {
      expect(isTimeInPeriod('02:00', 'noite')).toBe(true);
    });

    it('should return true for 05:59', () => {
      expect(isTimeInPeriod('05:59', 'noite')).toBe(true);
    });

    it('should return false for 06:00 (start of manha)', () => {
      expect(isTimeInPeriod('06:00', 'noite')).toBe(false);
    });

    it('should return false for 17:59 (end of tarde)', () => {
      expect(isTimeInPeriod('17:59', 'noite')).toBe(false);
    });

    it('should return false for 12:00', () => {
      expect(isTimeInPeriod('12:00', 'noite')).toBe(false);
    });
  });
});

describe('TIME_PERIODS', () => {
  it('should have 3 periods defined', () => {
    expect(Object.keys(TIME_PERIODS)).toHaveLength(3);
  });

  it('should have manha period', () => {
    expect(TIME_PERIODS.manha).toEqual({
      label: 'Manhã',
      start: 6,
      end: 12,
    });
  });

  it('should have tarde period', () => {
    expect(TIME_PERIODS.tarde).toEqual({
      label: 'Tarde',
      start: 12,
      end: 18,
    });
  });

  it('should have noite period', () => {
    expect(TIME_PERIODS.noite).toEqual({
      label: 'Noite',
      start: 18,
      end: 6,
    });
  });
});
