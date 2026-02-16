Audit the extension for security violations. This is critical — our users trust us with auth cookies.

Check every file for:
1. **No network calls**: grep for `fetch(`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, `new Image().src` — NONE should exist outside test files
2. **No persistent cookie storage**: grep for `storage.local.set` or `indexedDB` with cookie data — only user preferences allowed
3. **No eval/dynamic code**: grep for `eval(`, `Function(`, `setTimeout(string)`, `innerHTML =` with user data
4. **CSP in manifest**: verify `content_security_policy` blocks `unsafe-eval`, `unsafe-inline`, all external sources
5. **No data exfil vectors**: check that export only goes to clipboard or local file download, never to a URL
6. **Permissions minimal**: manifest must have ONLY `cookies`, `activeTab`, `storage`, host permissions
7. **Dependencies**: run `npm audit`, check for known vulnerabilities

Report: PASS/FAIL for each check with file:line references for any failures.
