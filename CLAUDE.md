# CookiePeek — Browser Extension

Cookie viewer/editor/exporter for developers and multi-account operators. Built with WXT + TypeScript + Vanilla DOM. Sibling project to [redirect-inspector](https://github.com/investblog/redirect-inspector) — reuse its patterns for architecture, CI, theme system, and messaging.

## Commands

```
npm run dev              # Chrome MV3 dev server with HMR
npm run dev:firefox      # Firefox MV2 dev server
npm run build            # Production build (Chrome)
npm run build:firefox    # Production build (Firefox)
npm run zip:all          # .zip packages for store submission
npm run typecheck        # TypeScript strict check
npm run lint             # Biome lint + format
npm run test             # Vitest unit tests
npm run check            # All checks (typecheck + lint + test)
```

## Tech Stack

- **WXT** (wxt.dev) — framework, cross-browser builds, entrypoint-based structure
- **TypeScript** strict mode — no `any`, no implicit returns
- **Vanilla DOM + CSS custom properties** — NO React, NO framework in popup. Must render <100ms
- **Biome** — linter + formatter (same config as redirect-inspector)
- **Vitest** — unit tests, mock `browser.cookies` API

## Architecture

```
src/
  entrypoints/
    background/index.ts        # Service worker: cookie ops, message router, badge
    popup/                     # Main UI: table, search, toolbar, decoded view, export
  background/
    cookies.ts                 # browser.cookies read/write/delete/watch
    decoder.ts                 # JWT, Base64, URL decode (auto-detect)
    formats.ts                 # Export: JSON, Netscape cookies.txt, Anti-Detect JSON
    badge.ts                   # Cookie count badge per tab
  shared/
    types/cookies.ts           # CookieRecord, DecodedValue, ExportFormat types
    messaging/                 # Type-safe message protocol (defineExtensionMessaging)
    theme.ts                   # Dark/light/system theme (from redirect-inspector)
    constants.ts               # Limits, defaults, format specs
```

## Critical Rules

- **All cookie data is ephemeral** — read on demand via `browser.cookies.getAll()`, NEVER persist to storage or IndexedDB. Only user preferences (theme, default export format) go to `browser.storage.local`
- **Zero network requests** — no analytics, no CDN, no remote code. Everything bundled. CSP must block all external
- **Popup speed is the product** — no dynamic imports, no lazy loading in popup. Bundle must be <50KB. Measure with `performance.now()` on every render path
- **Export warnings** — every export action shows a warning that cookies contain sensitive session data
- **Use `browser.*` API** (not `chrome.*`) — WXT polyfills this for cross-browser compat
- **Reuse redirect-inspector patterns**: message protocol shape, theme CSS custom properties, badge rendering, collapsible UI components, Biome config

## Cookie API Specifics

- `browser.cookies.getAll({ url })` — returns ALL cookies for a URL including HTTPOnly, Secure
- `browser.cookies.set()` — requires `url` field (construct from domain + path + secure)
- `browser.cookies.onChanged` — fires on set/delete/overwrite, use for live monitoring (v1.1)
- SameSite values: `"no_restriction"`, `"lax"`, `"strict"`, `"unspecified"` — map to human-readable labels
- Session cookies: `expirationDate` is undefined (not 0, not null)
- Domain cookies start with `.` — preserve the dot on export/import

## Decoder Logic (src/background/decoder.ts)

Detection priority: JWT → Base64 → URL-encoded → raw text.
- JWT: starts with `eyJ`, has 3 dot-separated parts. Decode header + payload, show expiry as human date
- Base64: valid charset + length divisible by 4 (after padding). If decoded is JSON, pretty-print
- URL-encoded: contains `%[0-9A-F]{2}`. Handle double-encoding
- Always provide manual override toggle to force decode mode

## Export Formats (src/background/formats.ts)

- **JSON**: array of `{ name, value, domain, path, expirationDate, secure, httpOnly, sameSite }`
- **Netscape cookies.txt**: `domain\tHTTPONLY_flag\tpath\tsecure\texpiry\tname\tvalue` per line
- **Anti-Detect JSON**: same as JSON but ensure `expirationDate` is Unix timestamp (seconds), `sameSite` uses `"no_restriction"` not `"none"`
- **Header string**: `name1=value1; name2=value2` (single line)

## Testing Strategy

- Mock `browser.cookies` in Vitest with `vi.fn()` — test all CRUD operations
- Test decoder with real-world cookie values: GA cookies, JWT tokens, base64 session IDs, URL-encoded payloads
- Test export format output byte-for-byte against known-good fixtures
- Test import with malformed input: truncated JSON, corrupted cookies.txt, empty clipboard

## Browser Testing with Claude in Chrome

Use `claude --chrome` for build-test-verify loop:
```
# After making changes, ask Claude to verify:
"Open chrome://extensions, reload CookiePeek, then go to github.com, click the CookiePeek icon and check if all cookies display correctly"

"Go to jwt.io, set a test JWT cookie, then verify CookiePeek decodes it in the popup"

"Test the export button — export as Netscape format, verify the downloaded file"
```

## Localization

- `_locales/en/messages.json` and `_locales/ru/messages.json`
- All user-facing strings via `browser.i18n.getMessage("key")`
- Keys use SCREAMING_SNAKE: `POPUP_TITLE`, `EXPORT_JSON`, `DECODE_JWT`, `WARNING_SENSITIVE_DATA`

## Build Targets

| Browser | Manifest | Output dir | Notes |
|---------|----------|------------|-------|
| Chrome  | V3       | `.output/chrome-mv3` | Primary target |
| Edge    | V3       | Same as Chrome | Chromium, identical build |
| Firefox | V2       | `.output/firefox-mv2` | WXT handles differences |
| Safari  | V3       | Deferred | `browser.cookies.getAll()` broken in Safari 18 |

## Git Workflow

- Branch naming: `feat/`, `fix/`, `chore/` prefix
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Tags: `vX.Y.Z` triggers GitHub Actions release with .zip artifacts
- Never commit `.output/`, `node_modules/`, `.env`
