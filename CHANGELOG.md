# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.1] - 2026-09-05

### Fixed

- Recover Windows desktop profiles affected by the V0.2.0 service-worker cache, which could leave the packaged application on a white screen after launch.
- Keep PWA service workers out of the Tauri runtime and clear stale worker registrations and caches without deleting local projects or preferences.
- Allow the packaged application to fetch bundled scientific SVGs from its own origin while retaining a restrictive network policy.

### Security

- Gate Windows packaging and publication on a real WebdriverIO/Tauri smoke test of the release-mode application.
- Version web cache namespaces per build and verify that the desktop recovery URL matches the release version.

## [0.2.0] - 2026-09-05

### Added

- Native Windows shell with least-privilege Tauri capabilities and offline WebView2 installers.
- CI-only release workflow for hosted Windows/static builds, SHA-256 checksums, SBOMs, and GitHub artifact attestations.
- First-run Home, three editable scientific templates, local recent projects, Settings, and desktop-style application menus.
- Generated PWA precache manifest and an end-to-end offline create/search/export test.
- Visible grid and optional snap-to-grid behavior.
- Verified 410-asset Bioicons catalog with pinned CC0 ingestion, sanitization, deduplication, rejection reporting, and paged local browsing.
- Ranked catalog search with local favorites and recently used views.
- Editable cell, phospholipid membrane, DNA, figure panel, and scale-bar drawing groups.
- Validated bar and line chart creation using editable vector primitives.
- Numeric object sizing, keyboard nudging, publication preflight, and downloadable publication reports.

### Changed

- Split the editor shell into focused application, panel, toolbar, and workspace components.
- Split the verified asset catalog from the initial Home bundle and load it on demand in the editor.
- Hardened source-tree and privacy checks against local release artifacts and development-machine metadata.
- Grouped routine Dependabot updates while retaining separate security updates.

## [0.1.0] - 2026-09-04

### Added

- Usable browser-first V0.1 editor with document presets and core vector objects.
- Multi-selection, transforms, grouping, layer ordering, alignment, lock/visibility, and undo/redo.
- Versioned `.obf.json` project model, IndexedDB autosave, import, and recovery.
- Editable SVG and configurable PNG export with embedded provenance summary.
- Four-asset verified Bioicons seed catalog with local search and filters.
- Publication check and Markdown/TXT attribution generation.
- Reproducible asset validation, SVG sanitizer, privacy audit, CI, and browser tests.
