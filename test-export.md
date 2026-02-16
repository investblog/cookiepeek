Test all export formats on a real page with cookies.

Steps:
1. Build and reload the extension
2. Go to $ARGUMENTS (default: google.com)
3. Open CookiePeek popup
4. Test each export format:
   - Click Export → JSON: verify valid JSON array with all cookie fields
   - Click Export → Netscape cookies.txt: verify tab-separated format
   - Click Export → Anti-Detect JSON: verify expirationDate is unix timestamp
   - Click Export → Header String: verify `name=value; name2=value2` format
5. For each format, paste clipboard content and validate structure
6. Report: number of cookies exported, any missing cookies vs DevTools count, format errors
