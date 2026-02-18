import type { DecodedValue, DecodeMode } from '@shared/types/cookies';
import { copyToClipboard, el, ICONS, svgIcon } from '../helpers';

let currentDecoded: DecodedValue | null = null;

export function createDecodedPanel(onClose: () => void, onForceMode: (mode: DecodeMode) => void): HTMLElement {
  const panel = el('div', 'decoded-panel');

  // Header
  const header = el('div', 'decoded-panel__header');
  const titleGroup = el('div', 'decoded-panel__title-group');
  titleGroup.appendChild(el('span', 'decoded-panel__title', 'Decoded Value'));

  const copyBtn = el('button', 'btn btn--ghost btn--icon decoded-panel__copy');
  copyBtn.title = 'Copy decoded value';
  copyBtn.appendChild(svgIcon(ICONS.copy, 14));
  copyBtn.addEventListener('click', () => {
    if (!currentDecoded) return;
    void copyToClipboard(currentDecoded.decoded).then((ok) => {
      if (ok) {
        const icon = copyBtn.querySelector('svg')!;
        icon.style.color = 'var(--success)';
        setTimeout(() => {
          icon.style.color = '';
        }, 2000);
      }
    });
  });
  titleGroup.appendChild(copyBtn);
  header.appendChild(titleGroup);

  const closeBtn = el('button', 'btn btn--ghost btn--icon');
  closeBtn.appendChild(svgIcon(ICONS.x, 16));
  closeBtn.addEventListener('click', onClose);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Mode buttons
  const modes = el('div', 'decoded-panel__modes');
  const modeButtons: Array<{ label: string; mode: DecodeMode }> = [
    { label: 'Raw', mode: 'raw' },
    { label: 'JWT', mode: 'jwt' },
    { label: 'Base64', mode: 'base64' },
    { label: 'URL', mode: 'url' },
  ];
  for (const m of modeButtons) {
    const btn = el('button', 'btn btn--sm btn--secondary', m.label);
    btn.dataset.mode = m.mode;
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      onForceMode(m.mode);
    });
    modes.appendChild(btn);
  }
  panel.appendChild(modes);

  // Body
  const body = el('div', 'decoded-panel__body');
  body.id = 'decoded-body';
  panel.appendChild(body);

  return panel;
}

export function updateDecodedPanel(panel: HTMLElement, decoded: DecodedValue): void {
  currentDecoded = decoded;
  const body = panel.querySelector('#decoded-body')!;
  body.innerHTML = '';

  // Highlight active mode, disable invalid modes
  const buttons = panel.querySelectorAll('.decoded-panel__modes button');
  for (const btn of buttons) {
    const b = btn as HTMLButtonElement;
    const isValid = decoded.validModes.includes(b.dataset.mode as DecodeMode);
    if (b.dataset.mode === decoded.mode) {
      b.className = 'btn btn--sm btn--primary';
      b.disabled = false;
      b.removeAttribute('aria-disabled');
      b.title = '';
    } else if (isValid) {
      b.className = 'btn btn--sm btn--secondary';
      b.disabled = false;
      b.removeAttribute('aria-disabled');
      b.title = '';
    } else {
      b.className = 'btn btn--sm btn--secondary btn--disabled';
      b.disabled = false;
      b.setAttribute('aria-disabled', 'true');
      b.title = `Value is not valid ${(b.dataset.mode ?? '').toUpperCase()}`;
    }
  }

  if (decoded.error) {
    const errEl = el('div', 'toast toast--error', decoded.error);
    errEl.style.position = 'static';
    errEl.style.transform = 'none';
    body.appendChild(errEl);
  }

  const pre = document.createElement('pre');
  pre.textContent = decoded.decoded;
  body.appendChild(pre);

  if (decoded.jwtExpiry) {
    const expiry = el('div', 'decoded-panel__jwt-expiry');
    const expiryDate = new Date(decoded.jwtExpiry);
    const isExpired = expiryDate.getTime() < Date.now();
    expiry.textContent = `${isExpired ? 'Expired' : 'Expires'}: ${expiryDate.toLocaleString()}`;
    if (isExpired) expiry.style.color = 'var(--danger)';
    body.appendChild(expiry);
  }
}
