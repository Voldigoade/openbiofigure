# ADR-002: Versioned engine-independent project format

- Status: Accepted
- Date: 2026-09-04

## Context

Saving Fabric’s raw serialization would couple user documents to one dependency’s internal schema and make migrations difficult.

## Decision

Use a versioned `OpenBioFigureProject` JSON contract with `.obf.json` in V0.1. Store metadata, document settings, ordered typed objects, embedded assets/provenance, and editor settings. Validate all imports with Zod and route them through explicit migrations.

## Consequences

- Files are readable, testable, and migrable.
- Adapter code must map between domain and engine objects.
- New object kinds require schema, migration, adapter, documentation, and round-trip tests.
- `.obf` packaging can be considered later without changing the semantic model.
