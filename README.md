# CookiePeek

Fast peek and control over cookies — one click, no extra steps.

Browser extension for viewing, decoding, editing, and exporting cookies. Built for developers, QA engineers, and multi-account operators.

## Features

- **Instant cookie table** with search, sort, and bulk operations
- **Auto-decode** JWT, Base64, and URL-encoded values inline
- **Export** as JSON, Netscape cookies.txt, Anti-Detect JSON, or Header string
- **Import** from JSON or Netscape format (paste or file upload)
- **Add / Edit / Delete** cookies with a slide-in drawer UI
- **Zero telemetry** — no network requests, no analytics, everything local
- **Dark / Light theme** with system preference support

## Install

| Browser | Store |
|---------|-------|
| Chrome | *Coming soon* |
| Edge | *Coming soon* |
| Firefox | *Coming soon* |
| Opera | *Coming soon* |

## Development

```bash
npm install
npm run dev            # Chrome dev server with HMR
npm run dev:firefox    # Firefox dev server
npm run build:all      # Production builds for all browsers
npm run check          # TypeScript + Biome lint + Vitest tests
```

### Build targets

```bash
npm run build          # Chrome MV3   → dist/chrome-mv3/
npm run build:firefox  # Firefox MV2  → dist/firefox-mv2/
npm run build:edge     # Edge MV3     → dist/edge-mv3/
npm run build:opera    # Opera MV3    → dist/opera-mv3/
npm run zip:all        # Zip packages for all stores
```

## Tech Stack

- [WXT](https://wxt.dev) — cross-browser extension framework
- TypeScript (strict mode)
- Vanilla DOM + CSS custom properties
- [Biome](https://biomejs.dev) — linter + formatter
- [Vitest](https://vitest.dev) — unit tests

## License

[Apache 2.0](LICENSE)
