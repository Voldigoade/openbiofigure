# OpenBioFigure

> **Status: early-stage.** V0.2 is the current release line. The editor is usable for local figure composition and export, but its file format and verified asset catalog may still evolve.

OpenBioFigure is an open-source, browser-first editor for scientific figures. It combines editable vector composition with native tracking of scientific asset provenance, licenses, and required credits—without an account, backend, telemetry, or mandatory AI.

## Why?

Scientific figures often require several tools, manual asset searches, and a separate licensing ledger. OpenBioFigure keeps the figure editable while provenance travels with every placed scientific asset.

## Key features

- Text, rectangles, ellipses, lines, arrows, connectors, SVG assets, and groups
- Multi-selection, transforms, layers, alignment, distribution, lock/visibility, undo/redo
- Local autosave and versioned `.obf.json` project files
- First-run Home, editable figure templates, and recent projects stored only on the device
- Ranked local asset search, filters, favorites, and recently used assets
- Editable cells, membranes, DNA, figure panels, scale bars, and bar/line charts
- Publication preflight plus Markdown/TXT attribution and publication reports
- Editable SVG and configurable-resolution PNG export with provenance metadata
- Sanitized local SVG import with optional provenance metadata

The bundled verified catalog contains 410 Bioicons assets: 409 CC0-1.0 assets and one CC-BY-3.0 asset. A pinned, reproducible ingestion pipeline rejects incomplete provenance and unsafe SVG content. OpenBioFigure helps track licensing metadata; it does not provide legal advice.

## Try it

[Open OpenBioFigure in your browser](https://voldigoade.github.io/openbiofigure/), or run it locally:

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The application works client-side and can be installed as a basic PWA after its resources have been loaded once.

## Development

Requires Node.js 20+ and pnpm 11.

```bash
pnpm install
pnpm verify
pnpm test:e2e
```

`pnpm build` produces a self-contained static site in `dist/`.

Windows desktop development additionally requires stable Rust and the Tauri prerequisites. `pnpm desktop:dev` starts the native shell; local desktop builds are for development validation only. Official installers are rebuilt from a clean GitHub-hosted runner and published with checksums and attestations. See the [desktop build guide](docs/DESKTOP.md) and [release verification guide](docs/RELEASES.md).

See [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture](docs/ARCHITECTURE.md), and the [project format](docs/PROJECT_FORMAT.md).

## License

OpenBioFigure software is licensed under [Apache License 2.0](LICENSE). Third-party scientific assets retain their own licenses, provenance, and attribution requirements; they are not covered by the software license. See [scientific asset licensing](docs/ASSET_LICENSING.md) and [third-party asset notices](packages/assets/THIRD_PARTY_ASSETS.md).
