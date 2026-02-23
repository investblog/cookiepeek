# Privacy Policy — CookiePeek

**Last updated:** February 23, 2026

## Summary

CookiePeek does not collect, store, or transmit any user data. Period.

## Data Collection

CookiePeek collects **no data whatsoever**:

- No personal information
- No browsing history
- No analytics or telemetry
- No crash reports
- No cookies are stored by the extension itself

## Cookie Access

CookiePeek reads cookies from the browser's cookie store **on demand** when you open the popup. This data is displayed locally in the popup UI and is never:

- Sent to any server
- Stored in extension storage
- Logged or cached beyond the popup session

When you close the popup, cookie data is discarded from memory.

## Network Requests

CookiePeek makes **zero network requests**. There are no analytics endpoints, no CDN resources, no remote code, and no outbound connections.

## Permissions

| Permission | Purpose |
|------------|---------|
| `cookies` | Read, create, edit, and delete cookies via the browser cookies API |
| `activeTab` | Get the URL of the current tab to query its cookies |
| `http://*/*`, `https://*/*` | Required by the cookies API to access cookies on standard web origins |

## Local Storage

The only data persisted locally is your **theme preference** (dark/light/auto), stored in the popup's localStorage. This never leaves your browser.

## Third Parties

CookiePeek has no third-party dependencies at runtime, no external services, and no server-side components. The extension is fully self-contained.

## Open Source

The complete source code is available at [github.com/investblog/cookiepeek](https://github.com/investblog/cookiepeek) under the Apache 2.0 license. You can audit every line.

## Contact

If you have questions about this privacy policy, open an issue on [GitHub](https://github.com/investblog/cookiepeek/issues).
