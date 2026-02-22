import { MAX_NAME_DISPLAY_LENGTH, MAX_VALUE_PREVIEW_LENGTH } from '@shared/constants';
import type { CookieRecord, SortField, SortState } from '@shared/types/cookies';
import { SAMESITE_LABEL_MAP } from '@shared/types/cookies';
import { el, ICONS, svgIcon } from '../helpers';

export interface TableCallbacks {
  onSort: (field: SortField) => void;
  onSelect: (key: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onClickValue: (cookie: CookieRecord) => void;
  onEdit: (cookie: CookieRecord) => void;
  onDelete: (cookie: CookieRecord) => void;
  onCopy: (cookie: CookieRecord) => void;
}

export function cookieKey(c: CookieRecord): string {
  return `${c.name}|${c.domain}|${c.path}`;
}

export function createTable(
  cookies: CookieRecord[],
  sortState: SortState,
  selectedKeys: Set<string>,
  callbacks: TableCallbacks,
): HTMLTableElement {
  const table = el('table', 'cookie-table');

  // Header
  const thead = el('thead');
  const headerRow = el('tr');

  // Select-all checkbox
  const thCheck = el('th', 'col-checkbox');
  const selectAll = document.createElement('input') as HTMLInputElement;
  selectAll.type = 'checkbox';
  selectAll.className = 'cookie-checkbox';
  selectAll.checked = cookies.length > 0 && selectedKeys.size === cookies.length;
  selectAll.addEventListener('change', () => callbacks.onSelectAll(selectAll.checked));
  thCheck.appendChild(selectAll);
  headerRow.appendChild(thCheck);

  const columns: Array<{ label: string; field: SortField | null; cls: string }> = [
    { label: 'Name', field: 'name', cls: 'col-name' },
    { label: 'Value', field: null, cls: 'col-value' },
    { label: 'Domain', field: 'domain', cls: 'col-domain' },
    { label: 'Path', field: 'path', cls: 'col-path' },
    { label: 'Expires', field: 'expires', cls: 'col-expires' },
    { label: 'Flags', field: null, cls: 'col-flags' },
    { label: '', field: null, cls: 'col-actions' },
  ];

  for (const col of columns) {
    const th = el('th', col.cls, col.label);
    if (col.field) {
      th.style.cursor = 'pointer';
      if (sortState.field === col.field) {
        const arrow = el('span', 'sort-arrow active', sortState.direction === 'asc' ? ' \u25B2' : ' \u25BC');
        th.appendChild(arrow);
      }
      th.addEventListener('click', () => callbacks.onSort(col.field!));
    }
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = el('tbody');
  for (const cookie of cookies) {
    const key = cookieKey(cookie);
    const tr = el('tr');
    tr.setAttribute('data-cookie-key', key);
    if (selectedKeys.has(key)) tr.classList.add('selected');

    // Checkbox
    const tdCheck = el('td');
    const cb = document.createElement('input') as HTMLInputElement;
    cb.type = 'checkbox';
    cb.className = 'cookie-checkbox';
    cb.checked = selectedKeys.has(key);
    cb.addEventListener('change', () => callbacks.onSelect(key, cb.checked));
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);

    // Name
    const tdName = el('td');
    tdName.textContent =
      cookie.name.length > MAX_NAME_DISPLAY_LENGTH
        ? `${cookie.name.slice(0, MAX_NAME_DISPLAY_LENGTH)}\u2026`
        : cookie.name;
    tdName.title = cookie.name;
    tr.appendChild(tdName);

    // Value (clickable)
    const tdValue = el('td', 'cookie-value');
    tdValue.textContent =
      cookie.value.length > MAX_VALUE_PREVIEW_LENGTH
        ? `${cookie.value.slice(0, MAX_VALUE_PREVIEW_LENGTH)}\u2026`
        : cookie.value;
    tdValue.title = 'Click to decode';
    tdValue.addEventListener('click', () => callbacks.onClickValue(cookie));
    tr.appendChild(tdValue);

    // Domain
    const tdDomain = el('td');
    tdDomain.textContent = cookie.domain;
    tdDomain.title = cookie.domain;
    tr.appendChild(tdDomain);

    // Path
    const tdPath = el('td');
    tdPath.textContent = cookie.path;
    if (cookie.path === '/') tdPath.style.color = 'var(--text-subtle)';
    tr.appendChild(tdPath);

    // Expires
    const tdExpires = el('td');
    if (cookie.expirationDate === undefined) {
      tdExpires.textContent = 'Session';
      tdExpires.className = 'expiry--session';
    } else {
      const date = new Date(cookie.expirationDate * 1000);
      const now = Date.now();
      if (date.getTime() < now) {
        tdExpires.className = 'expiry--expired';
      }
      tdExpires.textContent = formatDate(date);
      tdExpires.title = date.toISOString();
    }
    tr.appendChild(tdExpires);

    // Flags
    const tdFlags = el('td');
    const flags = el('div', 'flags');
    if (cookie.secure) flags.appendChild(el('span', 'flag flag--secure', 'S'));
    if (cookie.httpOnly) flags.appendChild(el('span', 'flag flag--httponly', 'H'));
    if (cookie.sameSite !== 'unspecified') {
      flags.appendChild(el('span', 'flag flag--samesite', SAMESITE_LABEL_MAP[cookie.sameSite].charAt(0)));
    }
    tdFlags.appendChild(flags);
    tr.appendChild(tdFlags);

    // Actions
    const tdActions = el('td');
    const actions = el('div', 'row-actions');

    const editBtn = el('button', 'btn btn--icon btn--ghost');
    editBtn.title = 'Edit';
    editBtn.appendChild(svgIcon(ICONS.edit, 14));
    editBtn.addEventListener('click', () => callbacks.onEdit(cookie));
    actions.appendChild(editBtn);

    const copyBtn = el('button', 'btn btn--icon btn--ghost');
    copyBtn.title = 'Copy value';
    copyBtn.appendChild(svgIcon(ICONS.copy, 14));
    copyBtn.addEventListener('click', () => callbacks.onCopy(cookie));
    actions.appendChild(copyBtn);

    const delBtn = el('button', 'btn btn--icon btn--ghost');
    delBtn.title = 'Delete';
    delBtn.appendChild(svgIcon(ICONS.trash, 14));
    delBtn.addEventListener('click', () => callbacks.onDelete(cookie));
    actions.appendChild(delBtn);

    tdActions.appendChild(actions);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function sortCookies(cookies: CookieRecord[], state: SortState): CookieRecord[] {
  const sorted = [...cookies];
  const dir = state.direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (state.field) {
      case 'name':
        return a.name.localeCompare(b.name) * dir;
      case 'domain':
        return a.domain.localeCompare(b.domain) * dir;
      case 'path':
        return a.path.localeCompare(b.path) * dir;
      case 'expires': {
        const ae = a.expirationDate ?? Number.MAX_SAFE_INTEGER;
        const be = b.expirationDate ?? Number.MAX_SAFE_INTEGER;
        return (ae - be) * dir;
      }
      case 'size':
        return (a.value.length - b.value.length) * dir;
      default:
        return 0;
    }
  });
  return sorted;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 30) return `${diffDays}d`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
  return `${Math.floor(diffDays / 365)}y`;
}
