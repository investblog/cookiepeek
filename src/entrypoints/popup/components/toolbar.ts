import type { ExportFormat } from '@shared/types/cookies';
import { el, ICONS, svgIcon } from '../helpers';

export interface ToolbarCallbacks {
  onExport: (format: ExportFormat) => void;
  onImport: () => void;
  onAddCookie: () => void;
  onRefresh: () => void;
  onBulkDelete: () => void;
}

export function createToolbar(callbacks: ToolbarCallbacks): HTMLElement {
  const toolbar = el('div', 'toolbar-actions');

  // Export dropdown
  const exportWrap = el('div', 'dropdown');
  const exportBtn = el('button', 'btn btn--secondary btn--sm');
  exportBtn.appendChild(svgIcon(ICONS.download, 12));
  exportBtn.appendChild(document.createTextNode(' Export'));
  const exportMenu = el('div', 'dropdown__menu');

  const formats: Array<{ label: string; format: ExportFormat }> = [
    { label: 'JSON', format: 'json' },
    { label: 'Netscape cookies.txt', format: 'netscape' },
    { label: 'Profile JSON', format: 'antidetect' },
    { label: 'Header String', format: 'header' },
  ];

  for (const f of formats) {
    const item = el('button', 'dropdown__item', f.label);
    item.addEventListener('click', () => {
      exportMenu.classList.remove('open');
      callbacks.onExport(f.format);
    });
    exportMenu.appendChild(item);
  }

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });

  exportWrap.appendChild(exportBtn);
  exportWrap.appendChild(exportMenu);
  toolbar.appendChild(exportWrap);

  // Import
  const importBtn = el('button', 'btn btn--secondary btn--sm');
  importBtn.appendChild(svgIcon(ICONS.upload, 12));
  importBtn.appendChild(document.createTextNode(' Import'));
  importBtn.addEventListener('click', () => callbacks.onImport());
  toolbar.appendChild(importBtn);

  // Add cookie
  const addBtn = el('button', 'btn btn--secondary btn--sm');
  addBtn.appendChild(svgIcon(ICONS.plus, 12));
  addBtn.appendChild(document.createTextNode(' Add'));
  addBtn.addEventListener('click', () => callbacks.onAddCookie());
  toolbar.appendChild(addBtn);

  // Refresh
  const refreshBtn = el('button', 'btn btn--ghost btn--sm');
  refreshBtn.title = 'Refresh';
  refreshBtn.appendChild(svgIcon(ICONS.refresh, 14));
  refreshBtn.addEventListener('click', () => callbacks.onRefresh());
  toolbar.appendChild(refreshBtn);

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    exportMenu.classList.remove('open');
  });

  return toolbar;
}

export function createBulkBar(count: number, onDelete: () => void, onExport: () => void): HTMLElement {
  const bar = el('div', 'bulk-bar');
  bar.appendChild(el('span', 'bulk-bar__count', `${count} selected`));

  const delBtn = el('button', 'btn btn--danger btn--sm', 'Delete');
  delBtn.addEventListener('click', onDelete);
  bar.appendChild(delBtn);

  const expBtn = el('button', 'btn btn--secondary btn--sm', 'Export Selected');
  expBtn.addEventListener('click', onExport);
  bar.appendChild(expBtn);

  return bar;
}
