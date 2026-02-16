Test the cookie decoder on pages with JWT and encoded cookies.

Steps:
1. Build and reload the extension
2. Go to jwt.io and set a test JWT cookie via DevTools console:
   `document.cookie = "test_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c; path=/"`
3. Set a base64 cookie: `document.cookie = "test_b64=eyJ1c2VyIjoiZnJhbmt5IiwidGVzdCI6dHJ1ZX0=; path=/"`
4. Set a URL-encoded cookie: `document.cookie = "test_url=hello%20world%26foo%3Dbar; path=/"`
5. Open CookiePeek popup
6. Click each test cookie value and verify:
   - JWT: shows header (alg, typ), payload (sub, name, iat as human date), signature
   - Base64: shows decoded JSON pretty-printed
   - URL-encoded: shows `hello world&foo=bar`
7. Test manual override: force JWT decode on a non-JWT cookie, verify graceful error
8. Report results for each decoder
