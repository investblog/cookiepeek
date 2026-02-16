const THEME_STORAGE_KEY = 'cookiepeek_theme';

export type Theme = 'dark' | 'light';
export type ThemePreference = Theme | 'auto';

export function getTheme(): Theme {
  const root = document.documentElement;

  const explicit = root.dataset.theme as Theme | undefined;
  if (explicit === 'dark' || explicit === 'light') {
    return explicit;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
    if (stored === 'dark' || stored === 'light' || stored === 'auto') {
      return stored;
    }
  } catch {
    // localStorage may be blocked
  }
  return 'auto';
}

export function setTheme(theme: Theme | null): void {
  const root = document.documentElement;
  if (theme) {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // localStorage may be blocked
  }

  if (preference === 'auto') {
    setTheme(null);
  } else {
    setTheme(preference);
  }
}

export function toggleTheme(): void {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setThemePreference(next);
}

export function initTheme(): void {
  const preference = getThemePreference();

  if (preference === 'auto') {
    setTheme(null);
  } else {
    setTheme(preference);
  }

  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', () => {
      if (getThemePreference() === 'auto') {
        document.dispatchEvent(new CustomEvent('themechange', { detail: getTheme() }));
      }
    });
  } catch {
    // matchMedia may not be available
  }
}

export function getThemeIcon(theme: Theme): string {
  return theme === 'dark' ? 'moon' : 'sun';
}
