export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag);
  if (className) elem.className = className;
  if (text) elem.textContent = text;
  return elem;
}

export function svgIcon(pathD: string, size = 16, filled = false): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  if (filled) {
    svg.setAttribute('fill', 'currentColor');
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = el('div', `toast toast--${type}`, message);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Lucide-style SVG icon paths
export const ICONS = {
  sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1',
  x: 'M18 6L6 18M6 6l12 12',
  chevronDown: 'M6 9l6 6 6-6',
  refresh: 'M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15',
  fileUpload:
    'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13.5,16V19H10.5V16H8L12,12L16,16H13.5M13,9V3.5L18.5,9H13Z',
};

/** CookiePeek brand icon — bracket cookie (concept D, transparent) */
export function svgBrandIcon(size = 18): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 128 128');
  svg.setAttribute('fill', 'none');

  // Left bracket
  const lb = document.createElementNS(ns, 'path');
  lb.setAttribute(
    'd',
    'M23.2 30C15.2 30 11.2 34 11.2 42V63.6C11.2 68.4 8.8 70.8 4 70.8C8.8 70.8 11.2 73.2 11.2 78V99.6C11.2 107.6 15.2 111.6 23.2 111.6',
  );
  lb.setAttribute('stroke', '#4A9EFF');
  lb.setAttribute('stroke-width', '6');
  lb.setAttribute('fill', 'none');
  lb.setAttribute('stroke-linecap', 'round');
  svg.appendChild(lb);

  // Right bracket
  const rb = document.createElementNS(ns, 'path');
  rb.setAttribute(
    'd',
    'M104.8 30C112.8 30 116.8 34 116.8 42V63.6C116.8 68.4 119.2 70.8 124 70.8C119.2 70.8 116.8 73.2 116.8 78V99.6C116.8 107.6 112.8 111.6 104.8 111.6',
  );
  rb.setAttribute('stroke', '#4A9EFF');
  rb.setAttribute('stroke-width', '6');
  rb.setAttribute('fill', 'none');
  rb.setAttribute('stroke-linecap', 'round');
  svg.appendChild(rb);

  // Cookie
  const cookie = document.createElementNS(ns, 'circle');
  cookie.setAttribute('cx', '64');
  cookie.setAttribute('cy', '70.8');
  cookie.setAttribute('r', '32.4');
  cookie.setAttribute('fill', '#e8a040');
  svg.appendChild(cookie);

  // Chips
  for (const [cx, cy, r] of [
    [49.6, 63.6, 5.5],
    [65.2, 84, 4.8],
  ]) {
    const chip = document.createElementNS(ns, 'circle');
    chip.setAttribute('cx', String(cx));
    chip.setAttribute('cy', String(cy));
    chip.setAttribute('r', String(r));
    chip.setAttribute('fill', '#5c3317');
    svg.appendChild(chip);
  }

  return svg;
}

/** 301.st brand logo — filled SVG (not stroke-based like Lucide icons) */
export function svg301Logo(size = 16): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 26 26');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M13.295 18.57c-.013 1.026-.074 2.047-.438 3.026-.681 1.828-2.003 2.903-3.893 3.284a8.3 8.3 0 0 1-1.56.146c-2.42.024-4.839.025-7.259.034H0v-5.454h.214c2.22.01 4.442.017 6.662.003a4 4 0 0 0 1.058-.16 1.66 1.66 0 0 0 1.22-1.546c.034-.746.052-1.494.031-2.24-.028-1.03-.769-1.766-1.8-1.803-.854-.03-1.71-.032-2.565-.035-1.536-.005-3.072 0-4.607-.008H0V9.5h.196c2.104 0 4.208.005 6.313-.007.307-.002.628-.053.917-.154.608-.212.98-.81.986-1.5q.003-.573 0-1.146c-.002-.878-.595-1.475-1.467-1.475H.034V.936h.172C3.289.947 6.37.943 9.454.95c.638.001 1.283.03 1.86.35.68.38 1.116.956 1.157 1.743.049.917.039 1.837.04 2.755.001.645-.004 1.29-.036 1.934-.045.886-.27 1.72-.849 2.42-.472.573-1.058.98-1.794 1.146-.01.002-.016.014-.041.036.089.018.167.031.243.05 1.595.404 2.635 1.372 2.984 3.001.128.598.203 1.213.24 1.824.047.785.048 1.574.037 2.361m8.421.051c-.002 1.014-.14 2.011-.596 2.933-.86 1.734-2.254 2.807-4.108 3.298-.848.224-1.712.225-2.59.2v-4.084c.265-.02.528-.026.788-.058 1.106-.136 1.82-.776 2.238-1.78.278-.667.396-1.375.41-2.089.04-1.84.053-3.68.064-5.52a60 60 0 0 0-.035-2.542c-.03-.8-.128-1.591-.436-2.343-.431-1.049-1.256-1.616-2.387-1.628-.429-.005-.857-.001-1.293-.001V.955c.018-.007.033-.018.048-.018.776.01 1.556-.023 2.327.043a5.94 5.94 0 0 1 3.612 1.601 5.94 5.94 0 0 1 1.857 3.404c.066.379.104.767.104 1.151q.01 5.869-.003 11.738zM26 .96v24.087q-.08.008-.152.01-1.155.003-2.312 0-.145 0-.286-.033a.38.38 0 0 1-.31-.325c-.017-.112-.016-.227-.016-.341q.002-11.388-.006-22.775c0-.44.185-.619.62-.621q.94-.004 1.883-.002z',
  );
  path.setAttribute('fill', '#4da3ff');
  svg.appendChild(path);
  return svg;
}
