import type { CookieRecord } from '@shared/types/cookies';
import { buildCookieUrl, setCookie } from './cookies';

export async function importCookies(
  input: string,
  format: 'json' | 'netscape',
): Promise<{ imported: number; errors: string[]; importedKeys: string[]; importedCookies: CookieRecord[] }> {
  const parsed = format === 'json' ? parseJson(input) : parseNetscape(input);
  let imported = 0;
  const errors: string[] = [...parsed.parseErrors];
  const importedKeys: string[] = [];
  const importedCookies: CookieRecord[] = [];

  for (const cookie of parsed.cookies) {
    try {
      const cookieUrl = buildCookieUrl(cookie.domain, cookie.path, cookie.secure);
      await setCookie(cookie, cookieUrl);
      imported++;
      importedKeys.push(`${cookie.name}|${cookie.domain}|${cookie.path}`);
      importedCookies.push(cookie);
    } catch (err) {
      errors.push(`${cookie.name}: ${(err as Error).message}`);
    }
  }

  return { imported, errors, importedKeys, importedCookies };
}

interface ParseResult {
  cookies: CookieRecord[];
  parseErrors: string[];
}

function parseJson(input: string): ParseResult {
  try {
    let data = JSON.parse(input.trim());

    // Unwrap object wrappers like {"cookies": [...]} or {"data": [...]}
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const values = Object.values(data);
      const arrayValue = values.find(Array.isArray);
      if (arrayValue) {
        data = arrayValue;
      } else {
        return { cookies: [], parseErrors: ['Input is not a JSON array'] };
      }
    }

    if (!Array.isArray(data)) {
      return { cookies: [], parseErrors: ['Input is not a JSON array'] };
    }

    const cookies: CookieRecord[] = [];
    const parseErrors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = normalizeKeys(data[i]);
      if (!item?.name || !item?.domain) {
        parseErrors.push(`Item ${i}: missing required fields (name, domain)`);
        continue;
      }
      cookies.push({
        name: String(item.name),
        value: String(item.value ?? ''),
        domain: String(item.domain),
        path: String(item.path ?? '/'),
        expirationDate: parseExpiry(item.expirationDate ?? item.expiry ?? item.expires),
        secure: Boolean(item.secure),
        httpOnly: Boolean(item.httpOnly),
        sameSite: validateSameSite(item.sameSite),
        storeId: item.storeId ? String(item.storeId) : undefined,
      });
    }
    return { cookies, parseErrors };
  } catch (err) {
    return { cookies: [], parseErrors: [`JSON parse error: ${(err as Error).message}`] };
  }
}

/** Normalize PascalCase / mixed-case keys to the camelCase names we expect */
function normalizeKeys(item: unknown): Record<string, unknown> | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const lower = key.toLowerCase();
    if (lower === 'name') out.name = value;
    else if (lower === 'value') out.value = value;
    else if (lower === 'domain') out.domain = value;
    else if (lower === 'path') out.path = value;
    else if (lower === 'secure') out.secure = value;
    else if (lower === 'httponly') out.httpOnly = value;
    else if (lower === 'samesite') out.sameSite = value;
    else if (lower === 'storeid') out.storeId = value;
    else if (lower === 'expirationdate') out.expirationDate = value;
    else if (lower === 'expiry') out.expiry = value;
    else if (lower === 'expires') out.expires = value;
    else out[key] = value;
  }
  return out;
}

/** Parse expiration from number (Unix timestamp) or date string; return undefined for session cookies */
function parseExpiry(value: unknown): number | undefined {
  if (value == null || value === 0 || value === '0') return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Try ISO date string (e.g. "2025-01-01T00:00:00.0000000+00:00")
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
  }
  return undefined;
}

function parseNetscape(input: string): ParseResult {
  const cookies: CookieRecord[] = [];
  const parseErrors: string[] = [];
  const lines = input.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('\t');
    if (parts.length < 7) {
      parseErrors.push(`Line ${i + 1}: expected 7 tab-separated fields, got ${parts.length}`);
      continue;
    }

    const [domain, _flag, path, secure, expiry, name, ...valueParts] = parts;
    cookies.push({
      name,
      value: valueParts.join('\t'),
      domain,
      path,
      expirationDate: expiry && expiry !== '0' ? Number(expiry) : undefined,
      secure: secure.toUpperCase() === 'TRUE',
      httpOnly: domain.startsWith('#HttpOnly_'),
      sameSite: 'lax',
    });
  }

  return { cookies, parseErrors };
}

function validateSameSite(value: unknown): CookieRecord['sameSite'] {
  if (typeof value !== 'string') return 'lax';
  const lower = value.toLowerCase();
  if (lower === 'no_restriction') return 'no_restriction';
  if (lower === 'lax') return 'lax';
  if (lower === 'strict') return 'strict';
  if (lower === 'unspecified') return 'unspecified';
  if (lower === 'none') return 'no_restriction';
  return 'lax';
}
