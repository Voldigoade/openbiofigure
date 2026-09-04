# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Native Windows shell with least-privilege Tauri capabilities and offline WebView2 installers.
- CI-only release workflow for hosted Windows/static builds, SHA-256 checksums, SBOMs, and GitHub artifact attestations.
- First-run Home, blank templates, local recent projects, Settings, and desktop-style application menus.
- Generated PWA precache manifest and an end-to-end offline create/search/export test.
- Visible grid and optional snap-to-grid behavior.

### Changed

- Split the editor shell into focused application, panel, toolbar, and workspace components.
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
