# CookiePeek — Product Spec

Cookie viewer/editor/exporter extension for developers and multi-account operators.
**License:** Apache 2.0 | **Domain:** cookiepeek.com | **Version:** 1.0

## Target Users

- Web developers debugging auth flows and session cookies
- QA testers verifying cookie behavior across environments
- Multi-account operators (Multilogin, GoLogin, AdsPower, Dolphin Anty)
- SEO/affiliate marketers managing cookie-based tracking

## Key Differentiators

| Feature | CookiePeek | Competitors |
|---------|-----------|-------------|
| Inline decode (JWT/Base64/URL) | Auto-detect + manual override | Copy to jwt.io manually |
| Anti-detect export | Dedicated format | Generic JSON only |
| Zero telemetry | No network requests, open-source | Ads, closed-source |
| Full cookie access | HTTPOnly, Secure, SameSite | Incomplete in many tools |
| Instant popup | Vanilla DOM, <100ms render | Framework overhead |

## Popup UI

### Cookie Table

| Column | Behavior |
|--------|----------|
| Name | Sortable, truncated at 30 chars with tooltip |
| Value | Click to open decoded panel |
| Domain | Leading dot preserved, sortable |
| Path | "/" shown muted |
| Expires | "Session" / relative time / "Expired" in red |
| Flags | Badges: S (Secure), H (HTTPOnly), L/S/N (SameSite) |
| Actions | Edit, Copy value, Delete |

### Toolbar

- Search: live filter across name/value/domain, 150ms debounce, "/" shortcut
- Export: JSON, Netscape cookies.txt, Anti-Detect JSON, Header string
- Import: JSON or Netscape from paste or file upload
- Add Cookie, Refresh, Bulk select/delete/export

### Decoded Panel

Auto-detection priority: JWT > Base64 > URL-encoded > raw.
- JWT: header + payload, human-readable expiry
- Base64: decoded string, pretty-printed if JSON
- URL: percent-decode, handles double-encoding
- Manual override toggles; invalid modes disabled
- Copy button with inline green flash feedback

## Export Formats

| Format | Output |
|--------|--------|
| JSON | `[{name, value, domain, path, expirationDate, secure, httpOnly, sameSite}]` |
| Netscape | `domain\tHTTPONLY\tpath\tsecure\texpiry\tname\tvalue` per line |
| Anti-Detect | JSON with unix timestamps, `sameSite: "no_restriction"` |
| Header | `name=value; name2=value2` single line |

## Architecture

- **WXT** framework, TypeScript strict, Vanilla DOM + CSS custom properties
- **Background** service worker: cookie CRUD, decoder, formatter, badge
- **Popup**: table, search, toolbar, drawers (edit/import), decoded panel
- **Theme**: dark/light/system via CSS tokens (301.st design system)
- **Messaging**: type-safe protocol between popup and background
- **Permissions**: `cookies`, `activeTab`, `storage`, `<all_urls>` host — nothing else

## Browser Support

| Browser | Manifest | Status |
|---------|----------|--------|
| Chrome | MV3 | Shipped |
| Edge | MV3 | Same build |
| Firefox | MV2 | Via WXT |
| Safari | MV3 | Deferred (cookies API bugs) |

## Performance Budget

- Popup JS: < 50 KB
- Popup render: < 100 ms
- Dynamic popup height: 200–600 px based on cookie count
- Zero network requests, zero dependencies at runtime
