# Verified seed asset catalog

This package contains the small, reviewed asset set bundled with OpenBioFigure V0.1. Catalogue metadata is authoritative for provenance inside the application; directory names are not treated as sufficient evidence on their own.

The four SVG files were retrieved individually from the Bioicons repository on 2026-09-04. Their exact upstream paths, creators, licences, source URLs, retrieval date, and SHA-256 hashes are recorded in `catalog.json` and `THIRD_PARTY_ASSETS.md`.

The software's Apache-2.0 licence does not cover these files. Each SVG remains under the licence recorded for that asset. Runtime imports are sanitized again before parsing.

Run `pnpm assets:validate` after any catalogue change. The command rejects incomplete metadata, duplicate identifiers or hashes, hash mismatches, and active SVG content.
