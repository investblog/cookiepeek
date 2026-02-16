Run the full pre-release checklist before tagging a new version.

Steps:
1. Run `npm run check` (typecheck + lint + test) — fix any failures
2. Run `npm run build` and `npm run build:firefox` — both must succeed
3. Verify bundle size: `du -sh .output/chrome-mv3/` — popup JS must be <50KB
4. Check manifest.json in `.output/chrome-mv3/manifest.json`:
   - Verify permissions are minimal: cookies, activeTab, storage only
   - No remote code, no externally_connectable
   - CSP blocks all external sources
5. Verify `_locales/en/messages.json` and `_locales/ru/messages.json` have same keys
6. Run `npm run zip:all` — verify zip files created
7. If $ARGUMENTS contains a version number, update version in package.json
8. Report: build sizes, test results, any warnings
