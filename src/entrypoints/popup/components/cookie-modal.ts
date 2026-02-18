import type { CookieRecord, SameSiteValue } from '@shared/types/cookies';
import { copyToClipboard, el, ICONS, svgIcon } from '../helpers';

export function showCookieModal(
  cookie: CookieRecord | null,
  onSave: (cookie: CookieRecord, url: string) => void,
  onCancel: () => void,
): HTMLElement {
  const drawer = document.createElement('aside');
  drawer.className = 'drawer';

  const overlay = el('div', 'drawer__overlay');
  const panel = el('div', 'drawer__panel');

  // Header
  const header = el('div', 'drawer__header');
  const title = el('span', 'drawer__title', cookie ? 'Edit Cookie' : 'Add Cookie');
  const closeBtn = el('button', 'btn btn--ghost btn--icon');
  closeBtn.appendChild(svgIcon(ICONS.x, 16));
  closeBtn.addEventListener('click', close);
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Body
  const body = el('div', 'drawer__body');

  // Name
  const nameField = createField('Name', 'text', cookie?.name ?? '');
  body.appendChild(nameField.wrap);

  // Value (with copy button)
  const valueField = createField('Value', 'textarea', cookie?.value ?? '');
  const valueLabelWrap = valueField.wrap.querySelector('.drawer__label')!;
  valueLabelWrap.classList.add('drawer__label--with-action');
  const copyBtn = el('button', 'btn btn--ghost btn--icon');
  copyBtn.type = 'button';
  copyBtn.title = 'Copy value';
  copyBtn.appendChild(svgIcon(ICONS.copy, 13));
  copyBtn.addEventListener('click', () => {
    void copyToClipboard(valueField.input.value).then((ok) => {
      if (ok) {
        const icon = copyBtn.querySelector('svg')!;
        icon.style.color = 'var(--success)';
        setTimeout(() => {
          icon.style.color = '';
        }, 2000);
      }
    });
  });
  valueLabelWrap.appendChild(copyBtn);
  body.appendChild(valueField.wrap);

  // Domain + Path row
  const row1 = el('div', 'drawer__row');
  const domainField = createField('Domain', 'text', cookie?.domain ?? '');
  const pathField = createField('Path', 'text', cookie?.path ?? '/');
  row1.appendChild(domainField.wrap);
  row1.appendChild(pathField.wrap);
  body.appendChild(row1);

  // Expiry
  const expiryField = createField(
    'Expires (UTC)',
    'datetime-local',
    cookie?.expirationDate ? toDateTimeLocal(cookie.expirationDate) : '',
  );
  body.appendChild(expiryField.wrap);

  // SameSite
  const sameSiteField = createSelect(
    'SameSite',
    [
      { value: 'lax', label: 'Lax' },
      { value: 'strict', label: 'Strict' },
      { value: 'no_restriction', label: 'None' },
      { value: 'unspecified', label: 'Unspecified' },
    ],
    cookie?.sameSite ?? 'lax',
  );
  body.appendChild(sameSiteField.wrap);

  // Checkboxes
  const checks = el('div', 'drawer__checks');
  const secureCb = createCheckbox('Secure', cookie?.secure ?? false);
  const httpOnlyCb = createCheckbox('HTTPOnly', cookie?.httpOnly ?? false);
  checks.appendChild(secureCb.wrap);
  checks.appendChild(httpOnlyCb.wrap);
  body.appendChild(checks);

  panel.appendChild(body);

  // Footer
  const footer = el('div', 'drawer__footer');
  const cancelBtn = el('button', 'btn btn--secondary', 'Cancel');
  cancelBtn.addEventListener('click', close);
  const saveBtn = el('button', 'btn btn--primary', 'Save');
  saveBtn.addEventListener('click', () => {
    const expiryVal = expiryField.input.value;
    let expirationDate: number | undefined;
    if (expiryVal) {
      expirationDate = new Date(`${expiryVal}Z`).getTime() / 1000;
    }

    const newCookie: CookieRecord = {
      name: nameField.input.value,
      value: valueField.input.value,
      domain: domainField.input.value,
      path: pathField.input.value || '/',
      expirationDate,
      secure: secureCb.input.checked,
      httpOnly: httpOnlyCb.input.checked,
      sameSite: sameSiteField.input.value as SameSiteValue,
    };

    const domain = newCookie.domain.startsWith('.') ? newCookie.domain.slice(1) : newCookie.domain;
    const protocol = newCookie.secure ? 'https' : 'http';
    const url = `${protocol}://${domain}${newCookie.path}`;

    drawer.remove();
    onSave(newCookie, url);
  });
  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
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

function createField(
  label: string,
  type: string,
  value: string,
): { wrap: HTMLElement; input: HTMLInputElement | HTMLTextAreaElement } {
  const wrap = el('div', 'drawer__field');
  wrap.appendChild(el('label', 'drawer__label', label));

  let input: HTMLInputElement | HTMLTextAreaElement;
  if (type === 'textarea') {
    input = el('textarea', 'drawer__input drawer__input--textarea') as HTMLTextAreaElement;
    (input as HTMLTextAreaElement).rows = 3;
  } else {
    input = el('input', 'drawer__input') as HTMLInputElement;
    (input as HTMLInputElement).type = type;
  }
  input.value = value;
  wrap.appendChild(input);
  return { wrap, input };
}

function createSelect(
  label: string,
  options: Array<{ value: string; label: string }>,
  current: string,
): { wrap: HTMLElement; input: HTMLSelectElement } {
  const wrap = el('div', 'drawer__field');
  wrap.appendChild(el('label', 'drawer__label', label));
  const select = document.createElement('select');
  select.className = 'drawer__input';
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === current) option.selected = true;
    select.appendChild(option);
  }
  wrap.appendChild(select);
  return { wrap, input: select };
}

function createCheckbox(label: string, checked: boolean): { wrap: HTMLElement; input: HTMLInputElement } {
  const wrap = el('label', 'drawer__check');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  wrap.appendChild(input);
  wrap.appendChild(document.createTextNode(` ${label}`));
  return { wrap, input };
}

function toDateTimeLocal(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().slice(0, 16);
}
