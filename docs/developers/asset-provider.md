# Adding an asset provider

Before writing an importer, document the official source, redistribution and modification rights, attribution requirements, metadata quality, automated-access constraints, and exact revision strategy. If these cannot be established, do not ingest the provider.

Implement the provider-independent contract in `src/domain/assets/schema.ts`. Each accepted record needs a stable ID, searchable title and keywords, category, provider and source references, creator when available, individual licence, attribution behavior, checksum, sanitized local SVG, and provenance timestamps.

Add a provider-specific ADR or policy, deterministic fixtures, validation tests, a rejection report, and third-party notices. Keep remote updates optional so the bundled catalog and editor remain useful offline.
