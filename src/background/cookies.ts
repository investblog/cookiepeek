import type { CookieRecord } from '@shared/types/cookies';
import type { Cookies } from 'wxt/browser';
import { browser } from 'wxt/browser';

export function toCookieRecord(cookie: Cookies.Cookie): CookieRecord {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expirationDate: cookie.expirationDate,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite as CookieRecord['sameSite'],
    storeId: cookie.storeId,
    hostOnly: cookie.hostOnly,
  };
}

export function buildCookieUrl(domain: string, path: string, secure: boolean): string {
  const cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;
  const protocol = secure ? 'https' : 'http';
  return `${protocol}://${cleanDomain}${path}`;
}

export async function getCookiesForTab(tabId: number): Promise<CookieRecord[]> {
  const tab = await browser.tabs.get(tabId);
  if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
    return [];
  }

  const cookies = await browser.cookies.getAll({ url: tab.url });
  return cookies.map(toCookieRecord);
}

export async function setCookie(cookie: CookieRecord, url: string): Promise<void> {
  const details: Cookies.SetDetailsType = {
    url,
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
  };

  if (cookie.expirationDate !== undefined) {
    details.expirationDate = cookie.expirationDate;
  }

  if (cookie.storeId) {
    details.storeId = cookie.storeId;
  }

  await browser.cookies.set(details);
}

export async function deleteCookie(name: string, url: string, storeId?: string): Promise<void> {
  const details: Cookies.RemoveDetailsType = { url, name };
  if (storeId) {
    details.storeId = storeId;
  }
  await browser.cookies.remove(details);
}

export async function deleteCookies(
  cookies: Array<{ name: string; url: string; storeId?: string }>,
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0;
  const errors: string[] = [];

  for (const c of cookies) {
    try {
      await deleteCookie(c.name, c.url, c.storeId);
      deleted++;
    } catch (err) {
      errors.push(`${c.name}: ${(err as Error).message}`);
    }
  }

  return { deleted, errors };
}
