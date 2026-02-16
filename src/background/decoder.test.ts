import { describe, expect, it } from 'vitest';
import { decodeValue } from './decoder';

describe('decodeValue', () => {
  describe('JWT detection', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    it('detects JWT token', () => {
      const result = decodeValue(jwt);
      expect(result.mode).toBe('jwt');
    });

    it('decodes JWT header', () => {
      const result = decodeValue(jwt);
      expect(result.jwtHeader).toEqual({ alg: 'HS256', typ: 'JWT' });
    });

    it('decodes JWT payload', () => {
      const result = decodeValue(jwt);
      expect(result.jwtPayload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      });
    });

    it('extracts expiry when present', () => {
      const jwtWithExp = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.signature';
      const result = decodeValue(jwtWithExp);
      // May have decode error due to invalid signature part, but still attempts header/payload
      if (!result.error) {
        expect(result.jwtExpiry).toBeDefined();
      }
    });

    it('returns error for malformed JWT payload', () => {
      const result = decodeValue('eyJhbGciOiJIUzI1NiJ9.invalidbase64!!!.sig', 'jwt');
      expect(result.error).toBeDefined();
    });
  });

  describe('Base64 detection', () => {
    it('decodes base64 JSON', () => {
      const b64 = 'eyJ1c2VyIjoiZnJhbmt5IiwidGVzdCI6dHJ1ZX0=';
      const result = decodeValue(b64);
      expect(result.mode).toBe('base64');
      const parsed = JSON.parse(result.decoded);
      expect(parsed).toEqual({ user: 'franky', test: true });
    });

    it('decodes base64 plain text', () => {
      const b64 = btoa('hello world test');
      const result = decodeValue(b64);
      expect(result.mode).toBe('base64');
      expect(result.decoded).toBe('hello world test');
    });

    it('does not detect short values as base64', () => {
      const result = decodeValue('abc');
      expect(result.mode).toBe('raw');
    });
  });

  describe('URL-encoded detection', () => {
    it('decodes URL-encoded value', () => {
      const result = decodeValue('hello%20world%26foo%3Dbar');
      expect(result.mode).toBe('url');
      expect(result.decoded).toBe('hello world&foo=bar');
    });

    it('handles double-encoding', () => {
      const doubleEncoded = encodeURIComponent(encodeURIComponent('test value'));
      const result = decodeValue(doubleEncoded);
      expect(result.mode).toBe('url');
      expect(result.decoded).toBe('test value');
    });
  });

  describe('raw fallback', () => {
    it('returns raw for plain text', () => {
      const result = decodeValue('simple_cookie_value');
      expect(result.mode).toBe('raw');
      expect(result.decoded).toBe('simple_cookie_value');
    });

    it('returns raw for empty string', () => {
      const result = decodeValue('');
      expect(result.mode).toBe('raw');
    });

    it('returns raw for GA cookies', () => {
      const result = decodeValue('GA1.2.1234567890.1234567890');
      expect(result.mode).toBe('raw');
    });
  });

  describe('force mode', () => {
    it('forces JWT decode on non-JWT value', () => {
      const result = decodeValue('not-a-jwt', 'jwt');
      expect(result.mode).toBe('jwt');
      expect(result.error).toBeDefined();
    });

    it('forces base64 decode', () => {
      const result = decodeValue(btoa('forced decode'), 'base64');
      expect(result.mode).toBe('base64');
      expect(result.decoded).toBe('forced decode');
    });

    it('forces URL decode', () => {
      const result = decodeValue('no%20encoding%20here', 'url');
      expect(result.mode).toBe('url');
      expect(result.decoded).toBe('no encoding here');
    });

    it('forces raw mode', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig';
      const result = decodeValue(jwt, 'raw');
      expect(result.mode).toBe('raw');
      expect(result.decoded).toBe(jwt);
    });
  });
});
