Build the extension, reload it in Chrome, and test the popup on the current page.

Steps:
1. Run `npm run build`
2. Navigate to chrome://extensions
3. Find CookiePeek and click the reload button
4. Go to $ARGUMENTS (default: github.com if no URL given)
5. Click the CookiePeek extension icon to open popup
6. Verify: cookie table renders, all cookies visible, search works
7. Report any console errors from the popup
