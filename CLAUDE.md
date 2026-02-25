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
    store-links.ts             # Per-browser store URLs for rating links
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

## Side Panel / Sidebar (v1.2)

Pin-to-side-panel lets users keep CookiePeek visible while browsing. The same `popup.html?sidepanel=1` is reused — no separate entrypoint. In sidepanel mode `body.sidepanel` class sets `width:100%; height:100vh` and `updatePopupHeight()` is bypassed.

### Browser matrix

| Browser | Manifest key | Permission | API to open | Popup pin button |
|---------|-------------|------------|-------------|-----------------|
| Chrome / Edge | `side_panel.default_path` | `sidePanel` | `(browser as any).sidePanel.open({ tabId })` | Yes |
| Firefox | `sidebar_action.default_panel` | — | `(browser as any).sidebarAction.open()` | Yes |
| Opera | `sidebar_action.default_panel` | — | No programmatic API (declarative only) | Hidden |

### Key implementation details

- **Detection in popup**: `(browser as any).sidePanel` (Chrome/Edge) or `(browser as any).sidebarAction` (Firefox). If neither exists, pin button is hidden
- **`?sidepanel=1` query param**: detected via `URLSearchParams` to apply sidepanel layout and hide the pin button
- **`wxt.config.ts`**: `sidePanel` permission and `side_panel` config gated with `browser !== 'firefox' && browser !== 'opera'`. Firefox and Opera get `sidebar_action` in their browser-specific manifest blocks
- **No background handler needed**: popup calls the APIs directly (Chrome `sidePanel.open` works from extension pages, Firefox `sidebarAction.open` works with user gesture)
- **Type safety**: both APIs accessed via `(browser as any)` cast — WXT polyfill does not type these Chrome/Firefox-specific APIs. Follow the [fastweb](https://github.com/nicepkg/fastweb) pattern

## Row Flash Highlights (v1.2)

Live cookie changes flash table rows green (added/changed) or red (removed) for 1.5s.

- **`pendingHighlights`** map in `popup/main.ts` — populated by live listener and manual actions (`onEdit`, `onAddCookie`), consumed by `applyPendingHighlights()` after `renderTable()`
- **`data-cookie-key`** attribute on `<tr>` — set in `table.ts`, queried via `CSS.escape()` for safe selector matching
- **CSS keyframes** `flash-added` / `flash-removed` — animate from `--flash-added-bg` / `--flash-removed-bg` to transparent
- **Theme tokens** in `theme.css` — dark theme uses `rgba(success, 0.28)` / `rgba(danger, 0.28)` for visibility; light theme uses `0.15` opacity
- **`ROW_FLASH_MS = 1500`** constant matches the CSS animation duration; class removed via `setTimeout`

## Store Rating Links (v1.2)

Per-browser store icons in the popup footer — each build links to its own store listing for ratings/reviews.

- **`src/shared/store-links.ts`** — `STORES` record keyed by browser name, `getStoreInfo()` returns URL/icon/label based on `import.meta.env.BROWSER` (WXT compile-time constant). Returns `null` when URL is empty (Opera — no store listing yet)
- **`src/public/icons/{chrome,edge,mozilla,opera}.svg`** — 24×24 browser brand icons (from fastweb reference project)
- **Popup integration** — `buildUI()` in `main.ts` appends an `<a><img></a>` to `footerLinks` after the GitHub icon. Gated by `getStoreInfo() !== null`

## Build Targets

| Browser | Manifest | Output dir | Notes |
|---------|----------|------------|-------|
| Chrome  | V3       | `.output/chrome-mv3` | Primary target |
| Edge    | V3       | Same as Chrome | Chromium, identical build |
| Firefox | V2       | `.output/firefox-mv2` | WXT handles differences |
| Opera   | V3       | `.output/opera-mv3` | `sidebar_action` for side panel |
| Safari  | V3       | Deferred | `browser.cookies.getAll()` broken in Safari 18 |

## Git Workflow

- Branch naming: `feat/`, `fix/`, `chore/` prefix
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Tags: `vX.Y.Z` triggers GitHub Actions release with .zip artifacts
- Never commit `.output/`, `node_modules/`, `.env`
