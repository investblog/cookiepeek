import type { CookieRecord } from '@shared/types/cookies';
import { buildCookieUrl, setCookie } from './cookies';

export async function importCookies(
  input: string,
  format: 'json' | 'netscape',
  url: string,
): Promise<{ imported: number; errors: string[] }> {
  const parsed = format === 'json' ? parseJson(input) : parseNetscape(input);
  let imported = 0;
  const errors: string[] = [...parsed.parseErrors];

  for (const cookie of parsed.cookies) {
    try {
      const cookieUrl = url || buildCookieUrl(cookie.domain, cookie.path, cookie.secure);
      await setCookie(cookie, cookieUrl);
      imported++;
    } catch (err) {
      errors.push(`${cookie.name}: ${(err as Error).message}`);
    }
  }

  return { imported, errors };
}

interface ParseResult {
  cookies: CookieRecord[];
  parseErrors: string[];
}

function parseJson(input: string): ParseResult {
  try {
    const data = JSON.parse(input.trim());
    if (!Array.isArray(data)) {
      return { cookies: [], parseErrors: ['Input is not a JSON array'] };
    }

    const cookies: CookieRecord[] = [];
    const parseErrors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item?.name || !item?.domain) {
        parseErrors.push(`Item ${i}: missing required fields (name, domain)`);
        continue;
      }
      cookies.push({
        name: String(item.name),
        value: String(item.value ?? ''),
        domain: String(item.domain),
        path: String(item.path ?? '/'),
        expirationDate: typeof item.expirationDate === 'number' ? item.expirationDate : undefined,
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
  const valid = ['no_restriction', 'lax', 'strict', 'unspecified'];
  if (typeof value === 'string' && valid.includes(value)) {
    return value as CookieRecord['sameSite'];
  }
  if (value === 'none' || value === 'None') return 'no_restriction';
  return 'lax';
}
