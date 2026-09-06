# Asset pipeline

The catalog pipeline turns reviewed provider material into deterministic, offline runtime data:

```text
provider source
→ pinned revision and policy
→ metadata normalization
→ schema and licence validation
→ SVG sanitization
→ duplicate detection
→ Windows-safe naming
→ SHA-256 integrity
→ search index and report
```

`pnpm assets:validate` checks every catalog record and SVG without network access. It rejects missing provenance, undeclared files, unsafe SVG content, duplicate IDs/content/source URLs, invalid paths, and checksum mismatches.

`pnpm assets:ingest:bioicons` intentionally rebuilds the pinned Bioicons snapshot. Provider ingestion must never infer an asset's licence from its neighbours or depend on fragile website HTML when an official repository, API, or manifest exists.
