# Verified scientific asset catalog

This package contains the reviewed asset set bundled with OpenBioFigure. Catalog metadata is authoritative for provenance inside the application; directory names are never treated as sufficient evidence on their own.

The current catalog contains 410 SVGs from Bioicons: 409 CC0-1.0 assets and one CC-BY-3.0 asset. The V0.2 CC0 expansion is reproducibly derived from the signed upstream commit recorded in `providers/bioicons.json`; it accepts only files with matching upstream metadata, an identified creator, a known license directory, and complete provenance. Exact upstream paths, creators, licenses, source URLs, retrieval dates, revisions, and sanitized-file SHA-256 hashes are recorded in `catalog.json`.

The software's Apache-2.0 licence does not cover these files. Each SVG remains under the licence recorded for that asset. Runtime imports are sanitized again before parsing.

Run `pnpm assets:ingest:bioicons` only when intentionally updating the pinned snapshot. The script filters, validates, sanitizes, deduplicates, and records rejected upstream files in `generated/bioicons-ingestion.json`. Run `pnpm assets:build` and `pnpm assets:validate` after any catalog change. Validation rejects incomplete metadata, duplicate identifiers or hashes, hash mismatches, undeclared files, and active SVG content.
