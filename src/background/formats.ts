import { NETSCAPE_HEADER } from '@shared/constants';
import type { CookieRecord, ExportFormat } from '@shared/types/cookies';

export function formatCookies(cookies: CookieRecord[], format: ExportFormat): string {
  switch (format) {
    case 'json':
      return formatJson(cookies);
    case 'netscape':
      return formatNetscape(cookies);
    case 'antidetect':
      return formatAntiDetect(cookies);
    case 'header':
      return formatHeader(cookies);
  }
}

function formatJson(cookies: CookieRecord[]): string {
  const output = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expirationDate: c.expirationDate ?? null,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
  }));
  return JSON.stringify(output, null, 2);
}

function formatNetscape(cookies: CookieRecord[]): string {
  const lines = cookies.map((c) => {
    const domain = c.domain;
    const flag = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = c.path;
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const expiry = c.expirationDate ? String(Math.floor(c.expirationDate)) : '0';
    return `${domain}\t${flag}\t${path}\t${secure}\t${expiry}\t${c.name}\t${c.value}`;
  });
  return NETSCAPE_HEADER + lines.join('\n');
}

function formatAntiDetect(cookies: CookieRecord[]): string {
  const output = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expirationDate: c.expirationDate ? Math.floor(c.expirationDate) : 0,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite === 'unspecified' ? 'no_restriction' : c.sameSite,
  }));
  return JSON.stringify(output, null, 2);
}

function formatHeader(cookies: CookieRecord[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}
