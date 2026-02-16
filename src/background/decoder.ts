import type { DecodedValue, DecodeMode } from '@shared/types/cookies';

export function decodeValue(value: string, forceMode?: DecodeMode): DecodedValue {
  const validModes = getValidModes(value);

  if (forceMode) {
    return { ...decodeForcedMode(value, forceMode), validModes };
  }

  if (isJwt(value)) {
    return { ...decodeJwt(value), validModes };
  }

  if (isBase64(value)) {
    return { ...decodeBase64(value), validModes };
  }

  if (isUrlEncoded(value)) {
    return { ...decodeUrlEncoded(value), validModes };
  }

  return { mode: 'raw', raw: value, decoded: value, validModes };
}

function getValidModes(value: string): DecodeMode[] {
  const modes: DecodeMode[] = ['raw'];
  if (isJwt(value)) modes.push('jwt');
  if (isBase64(value)) modes.push('base64');
  if (isUrlEncoded(value)) modes.push('url');
  return modes;
}

function isJwt(value: string): boolean {
  if (!value.startsWith('eyJ')) return false;
  const parts = value.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function decodeJwt(value: string): DecodedValue {
  try {
    const parts = value.split('.');
    const header = JSON.parse(atob(base64UrlToBase64(parts[0])));
    const payload = JSON.parse(atob(base64UrlToBase64(parts[1])));

    let jwtExpiry: string | undefined;
    if (payload.exp && typeof payload.exp === 'number') {
      jwtExpiry = new Date(payload.exp * 1000).toISOString();
    }

    const decoded = JSON.stringify({ header, payload }, null, 2);
    return { mode: 'jwt', raw: value, decoded, validModes: [], jwtHeader: header, jwtPayload: payload, jwtExpiry };
  } catch (err) {
    return { mode: 'jwt', raw: value, decoded: value, validModes: [], error: (err as Error).message };
  }
}

function base64UrlToBase64(str: string): string {
  let result = str.replace(/-/g, '+').replace(/_/g, '/');
  while (result.length % 4 !== 0) result += '=';
  return result;
}

function isBase64(value: string): boolean {
  if (value.length < 8) return false;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(value)) return false;
  const stripped = value.replace(/=+$/, '');
  if (stripped.length % 4 === 1) return false;
  try {
    const decoded = atob(base64UrlToBase64(value));
    return /^[\x20-\x7E\t\n\r]+$/.test(decoded);
  } catch {
    return false;
  }
}

function decodeBase64(value: string): DecodedValue {
  try {
    const normalized = base64UrlToBase64(value);
    const decoded = atob(normalized);
    try {
      const parsed = JSON.parse(decoded);
      return { mode: 'base64', raw: value, decoded: JSON.stringify(parsed, null, 2), validModes: [] };
    } catch {
      return { mode: 'base64', raw: value, decoded, validModes: [] };
    }
  } catch {
    return { mode: 'raw', raw: value, decoded: value, validModes: [] };
  }
}

function isUrlEncoded(value: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(value);
}

function decodeUrlEncoded(value: string): DecodedValue {
  try {
    let decoded = decodeURIComponent(value);
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      decoded = decodeURIComponent(decoded);
    }
    return { mode: 'url', raw: value, decoded, validModes: [] };
  } catch {
    return { mode: 'url', raw: value, decoded: value, validModes: [], error: 'Invalid URL encoding' };
  }
}

function decodeForcedMode(value: string, mode: DecodeMode): DecodedValue {
  switch (mode) {
    case 'jwt':
      return decodeJwt(value);
    case 'base64':
      return decodeBase64(value);
    case 'url':
      return decodeUrlEncoded(value);
    case 'raw':
      return { mode: 'raw', raw: value, decoded: value, validModes: [] };
  }
}
