import type { MessageMap } from '@shared/messaging';
import { sendMessageSafe } from '@shared/messaging';
import { getTheme, initTheme, toggleTheme } from '@shared/theme';
import type { CookieRecord, DecodedValue, DecodeMode, ExportFormat, SortState } from '@shared/types/cookies';
import { browser } from 'wxt/browser';
import { showCookieModal } from './components/cookie-modal';
import { createDecodedPanel, updateDecodedPanel } from './components/decoded-view';
import { detectExportFilename, detectExportMime } from './components/export-menu';
import { showImportDialog } from './components/import-dialog';
import { createSearch, filterCookies } from './components/search';
import { cookieKey, createTable, sortCookies } from './components/table';
import { createBulkBar, createToolbar } from './components/toolbar';
import {
  copyToClipboard,
  downloadFile,
  el,
  ICONS,
  showToast,
  svg301Logo,
  svgBrandIcon,
  svgGitHub,
  svgIcon,
  svgTelegram,
} from './helpers';

// ---- State ----
let allCookies: CookieRecord[] = [];
let filteredCookies: CookieRecord[] = [];
let sortState: SortState = { field: 'name', direction: 'asc' };
const selectedKeys = new Set<string>();
let currentTabId: number | undefined;
let currentTabUrl: string | undefined;
let searchQuery = '';

const t0 = performance.now();
const app = document.getElementById('app')!;

// ---- Decoded panel (persistent, slide in/out) ----
let decodedPanel: HTMLElement | null = null;
let currentDecodedCookie: CookieRecord | null = null;

// ---- Build UI ----
function buildUI(): void {
  app.innerHTML = '';

  // Header
  const header = el('div', 'popup__header');
  const titleLink = document.createElement('a');
  titleLink.href = 'https://301.st/?utm_source=cookiepeek&utm_medium=extension&utm_campaign=popup';
  titleLink.target = '_blank';
  titleLink.rel = 'noopener';
  titleLink.className = 'popup__title';
  titleLink.appendChild(svgBrandIcon(18));
  titleLink.appendChild(document.createTextNode('CookiePeek'));
  header.appendChild(titleLink);

  const headerActions = el('div', 'popup__header-actions');
  const themeBtn = el('button', 'theme-toggle');
  themeBtn.title = 'Toggle theme';
  updateThemeIcon(themeBtn);
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    updateThemeIcon(themeBtn);
  });
  headerActions.appendChild(themeBtn);
  header.appendChild(headerActions);
  app.appendChild(header);

  // Toolbar row: search + actions
  const toolbarRow = el('div', 'popup__toolbar');
  const { wrap: searchWrap, input: searchInput } = createSearch(onFilter);
  toolbarRow.appendChild(searchWrap);
  const toolbar = createToolbar({
    onExport: onExport,
    onImport: onImport,
    onAddCookie: onAddCookie,
    onRefresh: loadCookies,
    onBulkDelete: onBulkDelete,
  });
  toolbarRow.appendChild(toolbar);
  app.appendChild(toolbarRow);

  // Bulk bar placeholder
  const bulkBarSlot = el('div');
  bulkBarSlot.id = 'bulk-bar-slot';
  app.appendChild(bulkBarSlot);

  // Table wrapper
  const tableWrap = el('div', 'popup__table-wrap');
  tableWrap.id = 'table-wrap';
  app.appendChild(tableWrap);

  // Decoded panel
  decodedPanel = createDecodedPanel(
    () => {
      decodedPanel?.classList.remove('open');
      currentDecodedCookie = null;
      updatePopupHeight();
    },
    (mode: DecodeMode) => {
      if (currentDecodedCookie) void onForceDecodeMode(currentDecodedCookie, mode);
    },
  );
  app.appendChild(decodedPanel);

  // Footer
  const footer = el('div', 'popup__footer');
  footer.id = 'footer';
  const footerCount = el('span');
  footerCount.id = 'footer-count';
  footer.appendChild(footerCount);

  const footerLinks = el('div', 'popup__footer-links');
  const tgLink = document.createElement('a');
  tgLink.href = 'https://t.me/cookiepeek';
  tgLink.target = '_blank';
  tgLink.rel = 'noopener';
  tgLink.className = 'popup__footer-link';
  tgLink.title = 'Telegram';
  tgLink.appendChild(svgTelegram(14));
  footerLinks.appendChild(tgLink);
  const ghLink = document.createElement('a');
  ghLink.href = 'https://github.com/investblog/cookiepeek/issues';
  ghLink.target = '_blank';
  ghLink.rel = 'noopener';
  ghLink.className = 'popup__footer-link';
  ghLink.title = 'Feedback';
  ghLink.appendChild(svgGitHub(14));
  footerLinks.appendChild(ghLink);
  footer.appendChild(footerLinks);

  const sponsor = document.createElement('a');
  sponsor.href = 'https://301.st/?utm_source=cookiepeek&utm_medium=extension&utm_campaign=footer';
  sponsor.target = '_blank';
  sponsor.rel = 'noopener';
  sponsor.className = 'popup__sponsor';
  sponsor.appendChild(document.createTextNode('Sponsored by '));
  sponsor.appendChild(svg301Logo(14));
  footer.appendChild(sponsor);
  app.appendChild(footer);

  // Focus search on "/" key
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') {
      decodedPanel?.classList.remove('open');
      currentDecodedCookie = null;
      updatePopupHeight();
    }
  });
}

// ---- Popup height ----
const POPUP_ROW_HEIGHT = 28;
const POPUP_CHROME_HEIGHT = 108; // header + toolbar + footer + table header
const POPUP_MIN_HEIGHT = 200;
const POPUP_MAX_HEIGHT = 600;

function hasOpenOverlay(): boolean {
  return !!document.querySelector('.drawer') || !!decodedPanel?.classList.contains('open');
}

function updatePopupHeight(): void {
  if (hasOpenOverlay()) {
    document.body.style.height = `${POPUP_MAX_HEIGHT}px`;
    return;
  }
  const rows = filteredCookies.length || 3; // at least 3 rows worth for empty state
  const ideal = POPUP_CHROME_HEIGHT + rows * POPUP_ROW_HEIGHT;
  const height = Math.min(Math.max(ideal, POPUP_MIN_HEIGHT), POPUP_MAX_HEIGHT);
  document.body.style.height = `${height}px`;
}

// ---- Render ----
function renderTable(): void {
  const tableWrap = document.getElementById('table-wrap')!;
  tableWrap.innerHTML = '';

  const sorted = sortCookies(filteredCookies, sortState);

  if (sorted.length === 0) {
    const empty = el('div', 'empty-state');
    empty.appendChild(el('div', 'empty-state__icon', '\uD83C\uDF6A'));
    empty.appendChild(
      el('div', undefined, allCookies.length === 0 ? 'No cookies found for this page' : 'No cookies match your search'),
    );
    tableWrap.appendChild(empty);
  } else {
    const table = createTable(sorted, sortState, selectedKeys, {
      onSort,
      onSelect,
      onSelectAll,
      onClickValue,
      onEdit,
      onDelete,
      onCopy,
    });
    tableWrap.appendChild(table);
  }

  updateBulkBar();
  updateFooter();
  updatePopupHeight();
}

function updateBulkBar(): void {
  const slot = document.getElementById('bulk-bar-slot')!;
  slot.innerHTML = '';
  if (selectedKeys.size > 0) {
    const bar = createBulkBar(selectedKeys.size, onBulkDelete, () => onExportSelected());
    slot.appendChild(bar);
  }
}

function updateFooter(): void {
  const count = document.getElementById('footer-count')!;
  count.textContent = `${filteredCookies.length} cookie${filteredCookies.length !== 1 ? 's' : ''}`;
  if (filteredCookies.length !== allCookies.length) {
    count.textContent += ` (${allCookies.length} total)`;
  }
}

function updateThemeIcon(btn: HTMLElement): void {
  btn.innerHTML = '';
  const theme = getTheme();
  btn.appendChild(svgIcon(theme === 'dark' ? ICONS.sun : ICONS.moon, 16));
}

// ---- Data loading ----
async function loadCookies(): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab?.id;
    currentTabUrl = tab?.url;

    if (!currentTabId) {
      allCookies = [];
      applyFilterAndSort();
      return;
    }

    const response = await sendMessageSafe<MessageMap['cookiepeek:get-cookies']['response']>({
      type: 'cookiepeek:get-cookies',
      payload: { tabId: currentTabId },
    });

    if (response && !response.__error) {
      allCookies = response.cookies;
    } else {
      allCookies = [];
      console.error('Failed to load cookies:', response?.__error);
    }
  } catch (err) {
    allCookies = [];
    console.error('Failed to load cookies:', err);
  }

  applyFilterAndSort();
}

function applyFilterAndSort(): void {
  filteredCookies = filterCookies(allCookies, searchQuery);
  // Clean up selections for cookies no longer visible
  const visibleKeys = new Set(filteredCookies.map(cookieKey));
  for (const key of selectedKeys) {
    if (!visibleKeys.has(key)) selectedKeys.delete(key);
  }
  renderTable();
}

// ---- Event handlers ----
function onFilter(query: string): void {
  searchQuery = query;
  applyFilterAndSort();
}

function onSort(field: SortState['field']): void {
  if (sortState.field === field) {
    sortState = { field, direction: sortState.direction === 'asc' ? 'desc' : 'asc' };
  } else {
    sortState = { field, direction: 'asc' };
  }
  renderTable();
}

function onSelect(key: string, checked: boolean): void {
  if (checked) {
    selectedKeys.add(key);
  } else {
    selectedKeys.delete(key);
  }
  renderTable();
}

function onSelectAll(checked: boolean): void {
  if (checked) {
    for (const c of filteredCookies) selectedKeys.add(cookieKey(c));
  } else {
    selectedKeys.clear();
  }
  renderTable();
}

async function onClickValue(cookie: CookieRecord): Promise<void> {
  currentDecodedCookie = cookie;
  decodedPanel?.classList.add('open');
  updatePopupHeight();

  const response = await sendMessageSafe<DecodedValue>({
    type: 'cookiepeek:decode-value',
    payload: { value: cookie.value },
  });

  if (response && !response.__error && decodedPanel) {
    updateDecodedPanel(decodedPanel, response as DecodedValue);
  }
}

async function onForceDecodeMode(cookie: CookieRecord, mode: DecodeMode): Promise<void> {
  const response = await sendMessageSafe<DecodedValue>({
    type: 'cookiepeek:decode-value',
    payload: { value: cookie.value, forceMode: mode },
  });

  if (response && !response.__error && decodedPanel) {
    updateDecodedPanel(decodedPanel, response as DecodedValue);
  }
}

async function onEdit(cookie: CookieRecord): Promise<void> {
  const modal = showCookieModal(
    cookie,
    async (updated, url) => {
      const response = await sendMessageSafe<MessageMap['cookiepeek:set-cookie']['response']>({
        type: 'cookiepeek:set-cookie',
        payload: { cookie: updated, url },
      });
      if (response?.success) {
        showToast('Cookie saved', 'success');
        await loadCookies();
      } else {
        showToast(response?.error || 'Failed to save cookie', 'error');
      }
    },
    () => updatePopupHeight(),
  );
  document.body.appendChild(modal);
  updatePopupHeight();
}

async function onDelete(cookie: CookieRecord): Promise<void> {
  if (!currentTabUrl) return;
  const response = await sendMessageSafe<MessageMap['cookiepeek:delete-cookie']['response']>({
    type: 'cookiepeek:delete-cookie',
    payload: { name: cookie.name, url: currentTabUrl, storeId: cookie.storeId },
  });
  if (response?.success) {
    showToast('Cookie deleted', 'success');
    selectedKeys.delete(cookieKey(cookie));
    await loadCookies();
  } else {
    showToast(response?.error || 'Failed to delete cookie', 'error');
  }
}

async function onCopy(cookie: CookieRecord): Promise<void> {
  const ok = await copyToClipboard(cookie.value);
  showToast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

function onAddCookie(): void {
  const modal = showCookieModal(
    null,
    async (cookie, url) => {
      const response = await sendMessageSafe<MessageMap['cookiepeek:set-cookie']['response']>({
        type: 'cookiepeek:set-cookie',
        payload: { cookie, url },
      });
      if (response?.success) {
        showToast('Cookie added', 'success');
        await loadCookies();
      } else {
        showToast(response?.error || 'Failed to add cookie', 'error');
      }
    },
    () => updatePopupHeight(),
  );
  document.body.appendChild(modal);
  updatePopupHeight();
}

async function onExport(format: ExportFormat): Promise<void> {
  const cookiesToExport = selectedKeys.size > 0 ? getSelectedCookies() : allCookies;
  await doExport(cookiesToExport, format);
}

async function onExportSelected(): Promise<void> {
  await doExport(getSelectedCookies(), 'json');
}

async function doExport(cookies: CookieRecord[], format: ExportFormat): Promise<void> {
  const response = await sendMessageSafe<MessageMap['cookiepeek:export-cookies']['response']>({
    type: 'cookiepeek:export-cookies',
    payload: { cookies, format },
  });

  if (response?.output) {
    const ok = await copyToClipboard(response.output);
    if (ok) {
      showToast(`Exported ${cookies.length} cookies to clipboard`, 'success');
    } else {
      // Fallback to file download
      const domain = currentTabUrl ? new URL(currentTabUrl).hostname : 'cookies';
      downloadFile(response.output, detectExportFilename(format, domain), detectExportMime(format));
      showToast(`Downloaded ${cookies.length} cookies`, 'success');
    }
  } else {
    showToast(response?.error || 'Export failed', 'error');
  }
}

function onImport(): void {
  const modal = showImportDialog(
    async (input, format) => {
      if (!currentTabUrl) {
        showToast('No active tab URL', 'error');
        return;
      }
      const response = await sendMessageSafe<MessageMap['cookiepeek:import-cookies']['response']>({
        type: 'cookiepeek:import-cookies',
        payload: { input, format, url: currentTabUrl },
      });

      if (response && !response.__error) {
        const msg = `Imported ${response.imported} cookies`;
        const errCount = response.errors?.length ?? 0;
        showToast(errCount > 0 ? `${msg} (${errCount} errors)` : msg, errCount > 0 ? 'info' : 'success');
        await loadCookies();
      } else {
        showToast('Import failed', 'error');
      }
    },
    () => updatePopupHeight(),
  );
  document.body.appendChild(modal);
  updatePopupHeight();
}

async function onBulkDelete(): Promise<void> {
  if (!currentTabUrl || selectedKeys.size === 0) return;
  const cookies = getSelectedCookies().map((c) => ({
    name: c.name,
    url: currentTabUrl!,
    storeId: c.storeId,
  }));

  const response = await sendMessageSafe<MessageMap['cookiepeek:delete-cookies']['response']>({
    type: 'cookiepeek:delete-cookies',
    payload: { cookies },
  });

  if (response && !response.__error) {
    showToast(`Deleted ${response.deleted} cookies`, 'success');
    selectedKeys.clear();
    await loadCookies();
  } else {
    showToast('Delete failed', 'error');
  }
}

function getSelectedCookies(): CookieRecord[] {
  return allCookies.filter((c) => selectedKeys.has(cookieKey(c)));
}

// ---- Init ----
initTheme();
buildUI();
void loadCookies().then(() => {
  const t1 = performance.now();
  console.log(`CookiePeek render: ${(t1 - t0).toFixed(1)}ms`);
});
