# ADR-005: Pinned Bioicons catalog ingestion

- Status: accepted
- Date: 2026-09-05

## Context

OpenBioFigure needs a useful offline scientific catalog without treating a provider-level statement as blanket permission. Bioicons organizes files by license but also carries per-icon metadata. The complete repository is too large to bundle indiscriminately, and some repository files do not have matching metadata records.

## Decision

V0.2 ingests only SVG files from the Bioicons `cc-0` directory at a pinned, signed upstream Git commit. Candidates must be no larger than 100 KB, have a matching CC0 entry in the pinned `icons.json`, include a creator, and pass the OpenBioFigure SVG sanitizer. The pipeline stores the exact commit, upstream path, source URLs, creator, license, sanitized-file SHA-256 value, and retrieval date for every accepted asset.

Files with missing metadata are rejected and reported. Identical sanitized content is stored once. Invalid creator URLs are omitted instead of corrected or guessed. Safety sanitization is tracked by the ingestion process and is not presented to users as a creative modification requiring disclosure.

The four previously reviewed seed assets remain in place, including one CC-BY-3.0 mitochondrion with required attribution. No other Bioicons license directory is ingested by this decision.

## Consequences

- The application gains a substantial offline catalog while preserving per-asset evidence.
- Rebuilding the snapshot is deterministic with respect to the pinned upstream revision.
- Catalog updates are intentional source changes, not an automatic network sync.
- Assets over the size threshold and files with incomplete metadata remain unavailable until separately reviewed.
- Supporting another provider requires a provider-specific policy and normalized output conforming to the same catalog schema.
