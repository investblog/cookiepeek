# CookiePeek Testing Spec

## Pre-Release Checklist

1. `npm run check` — typecheck + lint + 42 unit tests
2. `npm run build && npm run build:firefox` — both succeed
3. Popup JS < 50 KB (`dist/chrome-mv3/chunks/popup-*.js`)
4. Manifest: permissions = `cookies`, `activeTab`, `storage` only; no remote code
5. Locale parity: `en/messages.json` and `ru/messages.json` have same keys
6. `npm run zip:all` — zip artifacts created
7. `npm audit` — no known vulnerabilities

## Security Audit

| Check | Grep for | Expected |
|-------|----------|----------|
| No network calls | `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` | Zero hits outside tests |
| No cookie persistence | `storage.local.set` with cookie data | Only user prefs (theme) |
| No eval/dynamic code | `eval(`, `Function(`, `innerHTML =` with user input | Zero hits |
| No data exfil | Export destinations | Clipboard or local file only |
| Minimal permissions | `manifest.json` permissions array | 3 permissions, `<all_urls>` host |
| CSP | `content_security_policy` | Blocks `unsafe-eval`, `unsafe-inline`, external |

## Manual Test: Popup

1. Build and reload extension in `chrome://extensions`
2. Open popup on any site — table renders, cookie count in footer
3. Search filters by name/value/domain
4. Column sort toggles direction
5. Edit/Add/Import open as right-side drawers
6. Bulk select + delete/export works
7. Theme toggle switches dark/light

## Manual Test: Decoder

Set test cookies via DevTools console:
```js
document.cookie = "jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U; path=/";
document.cookie = "b64=eyJ1c2VyIjoiZnJhbmt5In0=; path=/";
document.cookie = "url=hello%20world%26foo%3Dbar; path=/";
```

Verify in decoded panel:
- JWT: header + payload displayed, mode buttons JWT active, others disabled
- Base64: decoded JSON pretty-printed
- URL: `hello world&foo=bar`
- Copy button: icon turns green on click

## Manual Test: Export

On any site with cookies, test each format via Export dropdown:
- **JSON** — valid JSON array, all fields present
- **Netscape** — tab-separated, `#HttpOnly_` prefix where applicable
- **Anti-Detect** — `expirationDate` as unix seconds, `sameSite` = `no_restriction`
- **Header** — `name=value; name2=value2` single line

## E2E Tests (Planned)

Playwright with `--load-extension` in Docker. See task backlog.
