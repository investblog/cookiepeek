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
      const result = await importCookies(input, 'json');
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('fails on truncated JSON', async () => {
      const result = await importCookies('[{"name":"test"', 'json');
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('JSON parse error');
    });

    it('fails on non-array JSON', async () => {
      const result = await importCookies('{"name":"test"}', 'json');
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Input is not a JSON array');
    });

    it('skips items missing required fields', async () => {
      const input = JSON.stringify([{ name: 'good', domain: '.example.com' }, { value: 'no-name' }]);
      const result = await importCookies(input, 'json');
      expect(result.imported).toBe(1);
      expect(result.errors.some((e) => e.includes('missing required fields'))).toBe(true);
    });

    it('maps sameSite "none" to "no_restriction"', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([{ name: 'test', domain: '.example.com', sameSite: 'none' }]);
      await importCookies(input, 'json');
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
      const result = await importCookies(input, 'json');
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

    it('builds URL from cookie domain, not from provided tab URL', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([{ name: 'a', value: '1', domain: '.other-site.com', path: '/', secure: true }]);
      await importCookies(input, 'json');
      expect(browser.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://other-site.com/',
          domain: '.other-site.com',
        }),
      );
    });

    it('maps PascalCase sameSite values from ZennoPoster', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([
        { name: 'a', domain: '.example.com', sameSite: 'Unspecified' },
        { name: 'b', domain: '.example.com', sameSite: 'Strict' },
        { name: 'c', domain: '.example.com', sameSite: 'Lax' },
        { name: 'd', domain: '.example.com', sameSite: 'None' },
      ]);
      await importCookies(input, 'json');
      const calls = (browser.cookies.set as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0]).toMatchObject({ name: 'a', sameSite: 'unspecified' });
      expect(calls[1][0]).toMatchObject({ name: 'b', sameSite: 'strict' });
      expect(calls[2][0]).toMatchObject({ name: 'c', sameSite: 'lax' });
      expect(calls[3][0]).toMatchObject({ name: 'd', sameSite: 'no_restriction' });
    });

    it('imports exact ZennoPoster 7.8.15.0 JSON from forum report', async () => {
      // Exact cookie structure from https://zenno.club post #873127
      const input = JSON.stringify([
        {
          domain: 'chatgpt.com',
          expirationDate: 1773387566.0,
          hostOnly: true,
          httpOnly: true,
          name: 'oai-chat-web-route',
          path: '/chat/frontend/',
          sameSite: 'Unspecified',
          secure: false,
          session: false,
          storeId: null,
          value: 'dGVzdC12YWx1ZQ==',
          id: 1,
        },
        {
          domain: '.google.com',
          expirationDate: 1773500000.0,
          hostOnly: false,
          httpOnly: false,
          name: 'NID',
          path: '/',
          sameSite: 'None',
          secure: true,
          session: false,
          storeId: null,
          value: 'abc123',
          id: 2,
        },
        {
          domain: '.github.com',
          expirationDate: 0,
          hostOnly: false,
          httpOnly: true,
          name: '_gh_sess',
          path: '/',
          sameSite: 'Lax',
          secure: true,
          session: true,
          storeId: null,
          value: 'session-data',
          id: 3,
        },
      ]);
      const { browser } = await import('wxt/browser');
      // User is on example.com — cookies are from chatgpt, google, github
      const result = await importCookies(input, 'json');
      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);

      const calls = (browser.cookies.set as ReturnType<typeof vi.fn>).mock.calls;

      // Cookie 1: chatgpt.com, non-secure → http:// URL, sameSite "Unspecified" → "unspecified"
      expect(calls[0][0]).toMatchObject({
        url: 'http://chatgpt.com/chat/frontend/',
        name: 'oai-chat-web-route',
        domain: 'chatgpt.com',
        httpOnly: true,
        sameSite: 'unspecified',
        expirationDate: 1773387566.0,
      });

      // Cookie 2: .google.com, secure → https:// URL, sameSite "None" → "no_restriction"
      expect(calls[1][0]).toMatchObject({
        url: 'https://google.com/',
        name: 'NID',
        domain: '.google.com',
        sameSite: 'no_restriction',
        secure: true,
      });

      // Cookie 3: .github.com, expirationDate=0 → session cookie (no expirationDate), sameSite "Lax" → "lax"
      expect(calls[2][0]).toMatchObject({
        url: 'https://github.com/',
        name: '_gh_sess',
        domain: '.github.com',
        sameSite: 'lax',
        secure: true,
      });
      expect(calls[2][0].expirationDate).toBeUndefined();
    });

    it('unwraps object wrapper like {"cookies": [...]}', async () => {
      const input = JSON.stringify({
        cookies: [{ name: 'wrapped', domain: '.example.com', value: 'ok' }],
      });
      const result = await importCookies(input, 'json');
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('handles expiry as ISO date string', async () => {
      const { browser } = await import('wxt/browser');
      const input = JSON.stringify([{ name: 'test', domain: '.example.com', expires: '2026-06-01T00:00:00Z' }]);
      await importCookies(input, 'json');
      expect(browser.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          expirationDate: Math.floor(Date.parse('2026-06-01T00:00:00Z') / 1000),
        }),
      );
    });

    it('handles mixed-case keys like "DOMAIN", "NAME"', async () => {
      const input = JSON.stringify([{ NAME: 'upper', DOMAIN: '.example.com', VALUE: 'test', SECURE: true }]);
      const result = await importCookies(input, 'json');
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
      const result = await importCookies(input, 'netscape');
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('skips comment and empty lines', async () => {
      const input = ['# comment', '', '.example.com\tTRUE\t/\tTRUE\t0\ttest\tval'].join('\n');
      const result = await importCookies(input, 'netscape');
      expect(result.imported).toBe(1);
    });

    it('reports lines with wrong column count', async () => {
      const input = '.example.com\tTRUE\t/\tTRUE';
      const result = await importCookies(input, 'netscape');
      expect(result.imported).toBe(0);
      expect(result.errors.some((e) => e.includes('expected 7'))).toBe(true);
    });

    it('handles empty input', async () => {
      const result = await importCookies('', 'netscape');
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('preserves value containing tabs', async () => {
      const { browser } = await import('wxt/browser');
      const input = '.example.com\tTRUE\t/\tTRUE\t0\ttest\tval\twith\ttabs';
      await importCookies(input, 'netscape');
      expect(browser.cookies.set).toHaveBeenCalledWith(expect.objectContaining({ value: 'val\twith\ttabs' }));
    });
  });
});
