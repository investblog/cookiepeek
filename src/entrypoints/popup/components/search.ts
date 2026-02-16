import { SEARCH_DEBOUNCE_MS } from '@shared/constants';
import type { CookieRecord } from '@shared/types/cookies';
import { el } from '../helpers';

export function createSearch(onFilter: (query: string) => void): HTMLInputElement {
  const input = el('input', 'search-input') as HTMLInputElement;
  input.type = 'text';
  input.placeholder = 'Search cookies...';
  input.setAttribute('aria-label', 'Search cookies');

  let timer: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => onFilter(input.value), SEARCH_DEBOUNCE_MS);
  });

  return input;
}

export function filterCookies(cookies: CookieRecord[], query: string): CookieRecord[] {
  if (!query.trim()) return cookies;
  const lq = query.toLowerCase();
  return cookies.filter(
    (c) =>
      c.name.toLowerCase().includes(lq) || c.value.toLowerCase().includes(lq) || c.domain.toLowerCase().includes(lq),
  );
}
