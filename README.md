![CookiePeek](assets/banner-1400x560.png)

# CookiePeek

Privacy-first cookie manager for developers — view, search, decode, edit, export & import cookies with zero telemetry.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/neokbinekbljibacbahpflmdhinjhjjh)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?logo=firefox&logoColor=white)](https://addons.mozilla.org/firefox/addon/cookiepeek/)
[![Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/cachkpikjmlenneaknpganeffomgheig)
[![Opera Add-ons](https://img.shields.io/badge/Opera-Add--ons-FF1B2D?logo=opera&logoColor=white)](https://addons.opera.com/extensions/details/cookiepeek/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

## Features

- **Instant cookie table** — every cookie for the current site with name, value, domain, path, expiry, and flags. Search and sort by any column
- **Inline decode** — JWT tokens, Base64, and URL-encoded values decoded automatically. Switch modes manually or let CookiePeek detect the format
- **Edit & add cookies** — modify any field through a clean slide-in panel. Add new cookies from scratch
- **Bulk operations** — select multiple cookies and delete them in one click
- **Export** — JSON, Netscape cookies.txt, Header string, Profile JSON
- **Import** — paste or upload cookies in JSON or Netscape format with auto-detection
- **Dark & light theme** — follows system preference or toggle manually
- **Fully local** — no accounts, no analytics, no network requests, no data leaves your browser

## Install

| Browser | Link |
|---------|------|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/neokbinekbljibacbahpflmdhinjhjjh) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/cookiepeek/) |
| Edge | [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/cachkpikjmlenneaknpganeffomgheig) |
| Opera | [Opera Add-ons](https://addons.opera.com/extensions/details/cookiepeek/) |

## How it works

Click the toolbar icon on any site — CookiePeek reads cookies via the browser cookies API and displays them in a sortable, searchable table. Values are decoded inline (JWT, Base64, URL-encoded). Edit any cookie in a slide-in drawer, export in multiple formats, or import cookies from a file or clipboard.

Everything happens locally in the popup. No data is stored, transmitted, or logged.

## Development

```bash
git clone https://github.com/investblog/cookiepeek.git
cd cookiepeek
npm install

npm run dev            # Chrome MV3 dev server with HMR
npm run dev:firefox    # Firefox MV2 dev server
npm run build          # Chrome production build
npm run build:firefox  # Firefox production build
npm run zip:all        # Build all platforms
npm run check          # Typecheck + lint + test
```

## Tech stack

- [WXT](https://wxt.dev) — web extension framework with HMR
- TypeScript strict mode
- Vanilla DOM + CSS custom properties (no framework)
- Chrome MV3 + Firefox MV2 + Edge MV3 builds
- Zero runtime dependencies

## Privacy

CookiePeek makes zero network requests. No analytics, no telemetry, no remote code. Cookie data is read on demand and never persisted to extension storage. The only local data is your theme preference.

Full privacy policy: [PRIVACY.md](docs/PRIVACY.md)

## License

[Apache 2.0](LICENSE)

---

Built by [investblog](https://github.com/investblog) at [301.st](https://301.st) with [Claude](https://claude.ai)
