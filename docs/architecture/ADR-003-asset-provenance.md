# ADR-003: Asset provenance travels with the project

- Status: Accepted
- Date: 2026-09-04

## Context

Provider URLs and catalogs can change or disappear. A figure must retain the exact SVG, source, creator, license, attribution, and modification state used at composition time.

## Decision

Normalize provider records into one strict catalog schema. When an asset is placed, embed its sanitized SVG and provenance record in the project and reference it from canvas objects by stable `assetId`. Permit `UNKNOWN` only for explicit user imports, mark those records unverified, and fail the publication check until completed.

## Consequences

- Saved projects remain renderable and attributable offline.
- Project files are larger than URL-only manifests.
- Exact duplicate credits may be combined, but required attribution is never dropped.
- Catalog ingestion requires asset-level evidence, hash locking, sanitization, and CI validation.
