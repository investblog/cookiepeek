# Changelog

All notable changes to CookiePeek are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Export to file** — each export format now has separate clipboard (copy) and download (save as file) buttons ([ZennoLab forum request](https://zenno.club/discussion/threads/cookiepeek-besplatnyj-menedzher-kuk-dlja-chrome-export-cookies-txt-json-header-zero-telemetry-open-source.131631/post-872289) by **404**)
- Dual export actions in bulk bar (Export Selected → clipboard / file icons)
- Pill badge for selection count in bulk bar

## [1.2.0] — 2026-02-22

### Added
- **Pin to side panel** — keep CookiePeek open while browsing (Chrome/Edge Side Panel, Firefox Sidebar)
- **Row flash highlights** — live cookie changes flash green (added/changed) or red (removed) for 1.5s
- **Store rating links** — per-browser store icons in popup footer
- Opera `sidebar_action` support (declarative only, no programmatic open)

## [1.1.0] — 2026-02-19

### Added
- **Live cookie monitoring** — real-time `onChanged` listener with debounced table refresh
- Change log panel (clock icon in header)
- Live dot indicator in footer

### Fixed
- Floating promises lint violations (`noFloatingPromises` rule enabled)

## [1.0.4] — 2026-02-17

### Added
- Search clear button with `has-value` toggle

## [1.0.3] — 2026-02-17

### Added
- Footer links (Telegram, GitHub)
- Profile JSON: `hostOnly` and `session` fields

### Fixed
- Disabled decode buttons now show tooltip

## [1.0.2] — 2026-02-17

### Added
- Privacy policy page
- Tooltip on disabled decode buttons

### Changed
- README: banner, badges, store links

## [1.0.1] — 2026-02-17

### Fixed
- Rename "Anti-Detect JSON" → "Profile JSON" in UI and store copy

## [1.0.0] — 2026-02-17

### Added
- Cookie viewer with sortable table, search, selection
- Decoded value panel (JWT, Base64, URL-encoded, raw) with manual mode override
- Export: JSON, Netscape cookies.txt, Profile JSON, Header String
- Import: JSON and Netscape cookies.txt (paste or file upload)
- Cookie editor (add / edit / delete)
- Dark/light/system theme
- Cross-browser: Chrome, Edge, Firefox, Opera
- Zero telemetry, zero network requests
