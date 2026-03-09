import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the browser.cookies API before importing
vi.mock('wxt/browser', () => ({
  browser: {
    cookies: {
      set: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue({}),
      getAll: vi.fn().mockResolvedValue([]),
    },
    tabs: {
      get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com/' }),
    },
  },
}));

import { importCookies } from './importer';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('importCookies', () => {
  describe('JSON format', () => {
    it('imports valid JSON array', async () => {
      const input = JSON.stringify([
        {
          name: 'test',
          value: 'val',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
        },
        {
          name: 'test2',
          value: 'val2',
          domain: '.example.com',
          path: '/',
          secure: false,
          httpOnly: false,
          sameSite: 'lax',
        },
      ]);
      const result = await importCookies(input, 'json', 'https://example.com/');
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('fails on truncated JSON', async () => {
      const result = await importCookies('[{"name":"test"', 'json', 'https://example.com/');
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('JSON parse error');
    });

    it('fails on non-array JSON', async () => {
      const result = await importCookies('{"name":"test"}', 'json', 'https://example.com/');
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Input is not a JSON array');
    });

    it('skips items missing required fields', async () => {
      const input = JSON.stringify([{ name: 'good', domain: '.example.com' }, { value: 'no-name' }]);
      const result = await importCookies(input, 'json', 'https://example.com/');
      expect(result.imported).toBe(1);
      expect(result.errors.some((e) => e.includes('missing required fields'))).toBe(true);
    });

    it('maps sameSite "none" to "no_restriction"', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([{ name: 'test', domain: '.example.com', sameSite: 'none' }]);
      await importCookies(input, 'json', 'https://example.com/');
      expect(browser.cookies.set).toHaveBeenCalledWith(expect.objectContaining({ sameSite: 'no_restriction' }));
    });

    it('imports ZennoPoster PascalCase JSON format', async () => {
      const input = JSON.stringify([
        {
          Name: 'zp_session',
          Value: 'abc123',
          Domain: '.example.com',
          Path: '/',
          Secure: false,
          HttpOnly: true,
          Expires: '2027-01-15T10:30:00.0000000+00:00',
        },
        {
          Name: 'zp_token',
          Value: 'xyz789',
          Domain: '.example.com',
          Path: '/app',
          Secure: true,
          HttpOnly: false,
        },
      ]);
      const { browser } = await import('wxt/browser');
      const result = await importCookies(input, 'json', 'https://example.com/');
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(browser.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'zp_session',
          value: 'abc123',
          domain: '.example.com',
          httpOnly: true,
          expirationDate: Math.floor(Date.parse('2027-01-15T10:30:00.0000000+00:00') / 1000),
        }),
      );
    });

    it('unwraps object wrapper like {"cookies": [...]}', async () => {
      const input = JSON.stringify({
        cookies: [{ name: 'wrapped', domain: '.example.com', value: 'ok' }],
      });
      const result = await importCookies(input, 'json', 'https://example.com/');
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('handles expiry as ISO date string', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([{ name: 'test', domain: '.example.com', expires: '2026-06-01T00:00:00Z' }]);
      await importCookies(input, 'json', 'https://example.com/');
      expect(browser.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          expirationDate: Math.floor(Date.parse('2026-06-01T00:00:00Z') / 1000),
        }),
      );
    });

    it('handles mixed-case keys like "DOMAIN", "NAME"', async () => {
      const input = JSON.stringify([{ NAME: 'upper', DOMAIN: '.example.com', VALUE: 'test', SECURE: true }]);
      const result = await importCookies(input, 'json', 'https://example.com/');
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Netscape format', () => {
    it('imports valid cookies.txt', async () => {
      const input = [
        '# Netscape HTTP Cookie File',
        '.example.com\tTRUE\t/\tTRUE\t1700000000\tsession\tabc123',
        '.example.com\tTRUE\t/\tFALSE\t0\ttheme\tdark',
      ].join('\n');
      const result = await importCookies(input, 'netscape', 'https://example.com/');
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('skips comment and empty lines', async () => {
      const input = ['# comment', '', '.example.com\tTRUE\t/\tTRUE\t0\ttest\tval'].join('\n');
      const result = await importCookies(input, 'netscape', 'https://example.com/');
      expect(result.imported).toBe(1);
    });

    it('reports lines with wrong column count', async () => {
      const input = '.example.com\tTRUE\t/\tTRUE';
      const result = await importCookies(input, 'netscape', 'https://example.com/');
      expect(result.imported).toBe(0);
      expect(result.errors.some((e) => e.includes('expected 7'))).toBe(true);
    });

    it('handles empty input', async () => {
      const result = await importCookies('', 'netscape', 'https://example.com/');
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('preserves value containing tabs', async () => {
      const { browser } = await import('wxt/browser');
      const input = '.example.com\tTRUE\t/\tTRUE\t0\ttest\tval\twith\ttabs';
      await importCookies(input, 'netscape', 'https://example.com/');
      expect(browser.cookies.set).toHaveBeenCalledWith(expect.objectContaining({ value: 'val\twith\ttabs' }));
    });
  });
});
