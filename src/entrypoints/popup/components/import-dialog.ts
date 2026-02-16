import { el, ICONS, readFileAsText, svgIcon } from '../helpers';

export function showImportDialog(
  onImport: (input: string, format: 'json' | 'netscape') => void,
  onCancel: () => void,
): HTMLElement {
  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  const overlay = el('div', 'drawer__overlay');
  const panel = el('div', 'drawer__panel');

  // Header
  const header = el('div', 'drawer__header');
  const title = el('span', 'drawer__title', 'Import Cookies');
  const closeBtn = el('button', 'btn btn--ghost btn--icon');
  closeBtn.appendChild(svgIcon(ICONS.x, 16));
  closeBtn.addEventListener('click', close);
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Body
  const body = el('div', 'drawer__body');

  // Format tabs
  const tabs = el('div', 'import-dialog__tabs');
  let currentFormat: 'json' | 'netscape' = 'json';

  const jsonTab = el('button', 'btn btn--sm btn--primary', 'JSON');
  const netscapeTab = el('button', 'btn btn--sm btn--secondary', 'Netscape cookies.txt');

  jsonTab.addEventListener('click', () => {
    currentFormat = 'json';
    jsonTab.className = 'btn btn--sm btn--primary';
    netscapeTab.className = 'btn btn--sm btn--secondary';
  });
  netscapeTab.addEventListener('click', () => {
    currentFormat = 'netscape';
    netscapeTab.className = 'btn btn--sm btn--primary';
    jsonTab.className = 'btn btn--sm btn--secondary';
  });
  tabs.appendChild(jsonTab);
  tabs.appendChild(netscapeTab);
  body.appendChild(tabs);

  // Textarea for paste
  const textarea = el('textarea', 'import-dialog__textarea') as HTMLTextAreaElement;
  textarea.placeholder = 'Paste cookie data here...';
  textarea.rows = 8;
  body.appendChild(textarea);

  // File upload — hidden input + styled button
  const fileWrap = el('div', 'file-upload');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,.txt';
  fileInput.className = 'file-upload__input';
  const fileBtn = el('button', 'btn btn--secondary btn--sm');
  fileBtn.type = 'button';
  fileBtn.appendChild(svgIcon(ICONS.fileUpload, 14, true));
  fileBtn.appendChild(document.createTextNode('Choose file'));
  fileBtn.addEventListener('click', () => fileInput.click());
  const fileName = el('span', 'file-upload__name', 'No file chosen');
  fileInput.addEventListener('change', async () => {
    if (fileInput.files?.[0]) {
      fileName.textContent = fileInput.files[0].name;
      const text = await readFileAsText(fileInput.files[0]);
      textarea.value = text;
      // Auto-detect format
      const trimmed = text.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        currentFormat = 'json';
        jsonTab.className = 'btn btn--sm btn--primary';
        netscapeTab.className = 'btn btn--sm btn--secondary';
      } else {
        currentFormat = 'netscape';
        netscapeTab.className = 'btn btn--sm btn--primary';
        jsonTab.className = 'btn btn--sm btn--secondary';
      }
    }
  });
  fileWrap.appendChild(fileInput);
  fileWrap.appendChild(fileBtn);
  fileWrap.appendChild(fileName);
  body.appendChild(fileWrap);

  panel.appendChild(body);

  // Footer
  const footer = el('div', 'drawer__footer');
  const cancelBtn = el('button', 'btn btn--secondary', 'Cancel');
  cancelBtn.addEventListener('click', close);
  const importBtn = el('button', 'btn btn--primary', 'Import');
  importBtn.addEventListener('click', () => {
    const input = textarea.value.trim();
    if (!input) return;
    drawer.remove();
    onImport(input, currentFormat);
  });
  footer.appendChild(cancelBtn);
  footer.appendChild(importBtn);
  panel.appendChild(footer);

  // Assemble
  drawer.appendChild(overlay);
  drawer.appendChild(panel);

  // Close handlers
  overlay.addEventListener('click', close);

  function close(): void {
    drawer.remove();
    onCancel();
  }

  return drawer;
}
