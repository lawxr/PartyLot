import { describe, it, expect } from 'vitest';
import { formatHandle, stripHandle } from '@/lib/handle';

describe('formatHandle & stripHandle', () => {
  describe('formatHandle', () => {
    it('ensures exactly one leading @ symbol', () => {
      expect(formatHandle('law')).toBe('@law');
      expect(formatHandle('@law')).toBe('@law');
      expect(formatHandle('@@law')).toBe('@law');
      expect(formatHandle('@@@@law_party')).toBe('@law_party');
    });

    it('trims leading and trailing whitespace', () => {
      expect(formatHandle('  @@law  ')).toBe('@law');
      expect(formatHandle('   law   ')).toBe('@law');
    });

    it('handles empty and null values safely', () => {
      expect(formatHandle('')).toBe('');
      expect(formatHandle('   ')).toBe('');
      expect(formatHandle(null)).toBe('');
      expect(formatHandle(undefined)).toBe('');
    });
  });

  describe('stripHandle', () => {
    it('removes all leading @ symbols for form inputs', () => {
      expect(stripHandle('law')).toBe('law');
      expect(stripHandle('@law')).toBe('law');
      expect(stripHandle('@@law')).toBe('law');
      expect(stripHandle('@@@law')).toBe('law');
    });

    it('handles empty or null values', () => {
      expect(stripHandle('')).toBe('');
      expect(stripHandle(null)).toBe('');
      expect(stripHandle(undefined)).toBe('');
    });
  });
});
