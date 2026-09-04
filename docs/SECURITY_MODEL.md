# Security model

## Protected properties

- local figure content and provenance metadata stay on the device;
- imported content cannot execute scripts or fetch external resources through SVG;
- project and asset inputs fail closed when malformed or incomplete;
- reproducible catalog files match reviewed content by SHA-256;
- exports do not silently remove license obligations.

## Trust boundaries

Untrusted inputs include local SVG files, `.obf.json` projects, third-party asset files and metadata, npm dependencies, and browser storage. The bundled catalog is trusted only after deterministic CI validation, not merely because it is committed.

## Controls

- DOMPurify SVG profile plus a second DOM pass removes scripts, event handlers, `foreignObject`, embedded active elements, `javascript:` URLs, external HTTP(S) references, and unsafe CSS URLs/imports.
- SVG input is capped at 2 MB before parsing.
- Zod validates catalog and project structures at ingress.
- SHA-256 locks every bundled SVG; duplicate IDs, source URLs, and content are rejected.
- Unknown licenses are allowed only for explicit user imports and fail the publication check.
- The static application uses no telemetry, account, backend, or default network data sync.
- CI runs dependency review, CodeQL, secret-pattern checks, tests, and asset validation.

## Known limitations

- Browser image/SVG parser vulnerabilities remain part of the browser threat surface.
- A user can intentionally enter incorrect provenance; `verified` distinguishes reviewed catalog records from self-declared imports.
- The service worker provides offline caching, not signed update delivery.
- Exported SVG should still be treated as untrusted by downstream tools.
- Dependency integrity relies on the pnpm lockfile and upstream registries in addition to CI review.

## Security regression tests

Tests cover scripts, event attributes, `foreignObject`, `javascript:` URLs, external references, unsafe CSS, invalid/non-SVG input, size limits, catalog integrity, and unknown-license publication blocking.
