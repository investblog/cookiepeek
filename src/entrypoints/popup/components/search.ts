import { SEARCH_DEBOUNCE_MS } from '@shared/constants';
import type { CookieRecord } from '@shared/types/cookies';
import { el, ICONS, svgIcon } from '../helpers';

export interface SearchResult {
  wrap: HTMLElement;
  input: HTMLInputElement;
}

export function createSearch(onFilter: (query: string) => void): SearchResult {
  const wrap = el('div', 'search-wrap');
  const input = el('input', 'search-input') as HTMLInputElement;
  input.type = 'text';
  input.placeholder = 'Search cookies...';
  input.setAttribute('aria-label', 'Search cookies');
  wrap.appendChild(input);

  const clearBtn = el('button', 'search-wrap__clear');
  clearBtn.type = 'button';
  clearBtn.setAttribute('aria-label', 'Clear');
  clearBtn.appendChild(svgIcon(ICONS.x, 14));
  wrap.appendChild(clearBtn);

  let timer: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    wrap.classList.toggle('has-value', input.value.length > 0);
    timer = setTimeout(() => onFilter(input.value), SEARCH_DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    wrap.classList.remove('has-value');
    input.focus();
    onFilter('');
  });

  return { wrap, input };
}

export function filterCookies(cookies: CookieRecord[], query: string): CookieRecord[] {
  if (!query.trim()) return cookies;
  const lq = query.toLowerCase();
  return cookies.filter(
    (c) =>
      c.name.toLowerCase().includes(lq) || c.value.toLowerCase().includes(lq) || c.domain.toLowerCase().includes(lq),
  );
}
