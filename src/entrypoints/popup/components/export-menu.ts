import type { ExportFormat } from '@shared/types/cookies';

export function detectExportFilename(format: ExportFormat, domain: string): string {
  const clean = domain.replace(/^\./, '').replace(/[^a-z0-9.-]/gi, '_');
  switch (format) {
    case 'json':
      return `${clean}_cookies.json`;
    case 'netscape':
      return `${clean}_cookies.txt`;
    case 'antidetect':
      return `${clean}_antidetect.json`;
    case 'header':
      return `${clean}_header.txt`;
  }
}

export function detectExportMime(format: ExportFormat): string {
  switch (format) {
    case 'json':
    case 'antidetect':
      return 'application/json';
    case 'netscape':
    case 'header':
      return 'text/plain';
  }
}
