import type { CookieRecord } from '@shared/types/cookies';
import { describe, expect, it } from 'vitest';
import { formatCookies } from './formats';

const testCookies: CookieRecord[] = [
  {
    name: 'session_id',
    value: 'abc123',
    domain: '.example.com',
    path: '/',
    expirationDate: 1700000000,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  },
  {
    name: 'theme',
    value: 'dark',
    domain: 'example.com',
    path: '/',
    expirationDate: undefined,
    secure: false,
    httpOnly: false,
    sameSite: 'no_restriction',
  },
];

describe('formatCookies', () => {
  describe('JSON format', () => {
    it('produces valid JSON array', () => {
      const output = formatCookies(testCookies, 'json');
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('includes all required fields', () => {
      const output = formatCookies(testCookies, 'json');
      const parsed = JSON.parse(output);
      expect(parsed[0]).toEqual({
        name: 'session_id',
        value: 'abc123',
        domain: '.example.com',
        path: '/',
        expirationDate: 1700000000,
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      });
    });

    it('session cookie has null expirationDate', () => {
      const output = formatCookies(testCookies, 'json');
      const parsed = JSON.parse(output);
      expect(parsed[1].expirationDate).toBeNull();
    });

    it('handles empty array', () => {
      const output = formatCookies([], 'json');
      expect(JSON.parse(output)).toEqual([]);
    });
  });

  describe('Netscape format', () => {
    it('produces tab-separated lines', () => {
      const output = formatCookies(testCookies, 'netscape');
      const lines = output.split('\n').filter((l) => l && !l.startsWith('#'));
      expect(lines).toHaveLength(2);
      expect(lines[0].split('\t')).toHaveLength(7);
    });

    it('includes header comment', () => {
      const output = formatCookies(testCookies, 'netscape');
      expect(output).toContain('# Netscape HTTP Cookie File');
    });

    it('preserves domain dot prefix', () => {
      const output = formatCookies(testCookies, 'netscape');
      const lines = output.split('\n').filter((l) => l && !l.startsWith('#'));
      expect(lines[0]).toMatch(/^\.example\.com\t/);
    });

    it('formats secure flag correctly', () => {
      const output = formatCookies(testCookies, 'netscape');
      const lines = output.split('\n').filter((l) => l && !l.startsWith('#'));
      const cols = lines[0].split('\t');
      expect(cols[3]).toBe('TRUE'); // secure
    });

    it('session cookie has expiry 0', () => {
      const output = formatCookies(testCookies, 'netscape');
      const lines = output.split('\n').filter((l) => l && !l.startsWith('#'));
      const cols = lines[1].split('\t');
      expect(cols[4]).toBe('0');
    });
  });

  describe('Anti-Detect JSON format', () => {
    it('expirationDate is integer', () => {
      const output = formatCookies(testCookies, 'antidetect');
      const parsed = JSON.parse(output);
      expect(typeof parsed[0].expirationDate).toBe('number');
      expect(Number.isInteger(parsed[0].expirationDate)).toBe(true);
    });

    it('session cookie has expirationDate 0', () => {
      const output = formatCookies(testCookies, 'antidetect');
      const parsed = JSON.parse(output);
      expect(parsed[1].expirationDate).toBe(0);
    });

    it('maps unspecified sameSite to no_restriction', () => {
      const cookies: CookieRecord[] = [{ ...testCookies[0], sameSite: 'unspecified' }];
      const output = formatCookies(cookies, 'antidetect');
      const parsed = JSON.parse(output);
      expect(parsed[0].sameSite).toBe('no_restriction');
    });
  });

  describe('Header string format', () => {
    it('produces semicolon-separated pairs', () => {
      const output = formatCookies(testCookies, 'header');
      expect(output).toBe('session_id=abc123; theme=dark');
    });

    it('handles single cookie', () => {
      const output = formatCookies([testCookies[0]], 'header');
      expect(output).toBe('session_id=abc123');
    });

    it('handles empty array', () => {
      const output = formatCookies([], 'header');
      expect(output).toBe('');
    });
  });
});
