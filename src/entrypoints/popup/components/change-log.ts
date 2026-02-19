import type { CookieChangeEvent } from '@shared/types/cookies';
import { el } from '../helpers';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function typeSymbol(type: CookieChangeEvent['type']): string {
  return type === 'removed' ? '\u2212' : '+';
}

function typeClass(type: CookieChangeEvent['type']): string {
  return type === 'removed' ? 'change-log__type--removed' : 'change-log__type--added';
}

function createEntry(event: CookieChangeEvent): HTMLElement {
  const row = el('div', 'change-log__entry');
  const time = el('span', 'change-log__time', formatTime(event.timestamp));
  const sym = el('span', typeClass(event.type), ` [${typeSymbol(event.type)}] `);
  const name = el('span', undefined, `${event.cookie.name} `);
  const domain = el('span', 'change-log__domain', `(${event.cookie.domain})`);
  row.appendChild(time);
  row.appendChild(sym);
  row.appendChild(name);
  row.appendChild(domain);
  return row;
}

export function createChangeLogPanel(initialLog: CookieChangeEvent[], onClose: () => void): HTMLElement {
  const drawer = el('div', 'drawer');

  const overlay = el('div', 'drawer__overlay');
  overlay.addEventListener('click', () => {
    drawer.remove();
    onClose();
  });
  drawer.appendChild(overlay);

  const panel = el('div', 'drawer__panel');

  const header = el('div', 'drawer__header');
  header.appendChild(el('div', 'drawer__title', 'Change Log'));
  const closeBtn = el('button', 'btn btn--ghost btn--icon');
  closeBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  closeBtn.addEventListener('click', () => {
    drawer.remove();
    onClose();
  });
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const body = el('div', 'drawer__body change-log__list');
  body.id = 'change-log-body';

  if (initialLog.length === 0) {
    body.appendChild(el('div', 'change-log__empty', 'No cookie changes recorded yet'));
  } else {
    for (let i = initialLog.length - 1; i >= 0; i--) {
      body.appendChild(createEntry(initialLog[i]));
    }
  }

  panel.appendChild(body);
  drawer.appendChild(panel);
  return drawer;
}

export function appendChangeLogEntry(event: CookieChangeEvent): void {
  const body = document.getElementById('change-log-body');
  if (!body) return;

  const empty = body.querySelector('.change-log__empty');
  if (empty) empty.remove();

  body.insertBefore(createEntry(event), body.firstChild);
}
