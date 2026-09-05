# Contributing to OpenBioFigure

OpenBioFigure welcomes focused contributions to code, documentation, scientific assets, and licensing metadata. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and never include patient data, confidential research, secrets, or personal information.

## Setup

Requirements: Node.js 20+ and pnpm 11.

```bash
git clone <repository-url>
cd openbiofigure
pnpm install
pnpm dev
```

The Vite URL opens a fully client-side editor; no account or external service is required.

## Commands

| Command                       | Purpose                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                    | Start the development server                                                   |
| `pnpm test`                   | Run unit and integration tests                                                 |
| `pnpm test:e2e`               | Build and run Playwright browser workflows                                     |
| `pnpm assets:validate`        | Validate asset schema, hashes, safety, licenses, and duplicates                |
| `pnpm assets:build`           | Regenerate the local search index and asset report                             |
| `pnpm assets:ingest:bioicons` | Intentionally rebuild the pinned Bioicons snapshot                             |
| `pnpm verify`                 | Run formatting, lint, types, tests, asset validation, privacy audit, and build |

## Architecture at a glance

- `src/domain/`: engine-independent project, asset, licensing, storage, and export logic
- `src/editor/`: Fabric.js adapter and canvas commands
- `src/assets/`: provider registry and bundled catalog adapter
- `packages/assets/`: verified SVGs, metadata, notices, and generated index
- `scripts/assets/`: deterministic asset pipeline
- `tests/`: domain, integration, security, and browser tests

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the architecture decisions in `docs/architecture/` before changing boundaries.

## Reporting bugs and proposing features

Search existing issues first. Bug reports should include reproducible steps, expected and actual behavior, browser/OS details, and a minimal project when safe. Feature proposals should explain the scientific workflow and user outcome before proposing an implementation. Discuss large changes before writing them.

## Code and documentation

- Keep pull requests focused and preserve local-first, vector-first behavior.
- Add tests that fail without the change and verify meaningful outcomes.
- Keep important UI strings in the i18n layer when extending a workflow.
- Update format/security/licensing documentation when changing those contracts.
- Do not add telemetry, remote persistence, AI requirements, or new dependencies without explicit justification.

## Adding a scientific asset

An asset is accepted only when redistribution rights and the exact source can be verified.

1. Add a pre-sanitized SVG to `packages/assets/svg/`.
2. Add its complete record to `packages/assets/catalog.json`, including creator, exact source/asset URLs, retrieval date, license identifier/name/URL, attribution requirement/text, modification state, and SHA-256 integrity.
3. Run `pnpm assets:build` and `pnpm assets:validate`.
4. Update `packages/assets/THIRD_PARTY_ASSETS.md` when the catalog summary changes.
5. Include evidence for the asset-specific license review in the pull request.

Unknown or collection-level-only licensing is not sufficient. Do not mass-scrape a provider or assume one license applies to its whole library.

## Adding an asset provider

Implement the `AssetProvider` interface in `src/domain/assets/schema.ts`. Providers must return normalized metadata and sanitized SVG content, work without weakening the project schema, and document caching, provenance, failure, and license-review behavior. Add a provider-specific policy or ADR defining the exact source revision and accepted license scope. Remote providers must remain optional so the editor stays useful offline.

## Licensing contributions

Code contributions are accepted under Apache-2.0. Scientific assets remain under their own licenses. Metadata corrections should include the affected record, evidence URL, field-level correction, and verification date.
