# OpenBioFigure

> **Status: early-stage V0.1.** The editor is usable for local figure composition and export, but its file format and small verified asset catalog may still evolve.

OpenBioFigure is an open-source, browser-first editor for scientific figures. It combines editable vector composition with native tracking of scientific asset provenance, licenses, and required credits—without an account, backend, telemetry, or mandatory AI.

## Why?

Scientific figures often require several tools, manual asset searches, and a separate licensing ledger. OpenBioFigure keeps the figure editable while provenance travels with every placed scientific asset.

## Key features

- Text, rectangles, ellipses, lines, arrows, connectors, SVG assets, and groups
- Multi-selection, transforms, layers, alignment, distribution, lock/visibility, undo/redo
- Local autosave and versioned `.obf.json` project files
- Instant local asset search with category, source, license, and attribution filters
- Publication check and Markdown/TXT attribution generation
- Editable SVG and configurable-resolution PNG export
- Sanitized local SVG import with optional provenance metadata

The bundled seed catalog currently contains four individually verified Bioicons assets. OpenBioFigure helps track licensing metadata; it does not provide legal advice.

## Try it

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The application works client-side and can be installed as a basic PWA after its resources have been loaded once.

## Development

Requires Node.js 20+ and pnpm 10.

```bash
pnpm install
pnpm verify
pnpm test:e2e
```

`pnpm build` produces a self-contained static site in `dist/`.

See [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture](docs/ARCHITECTURE.md), and the [project format](docs/PROJECT_FORMAT.md).

## License

OpenBioFigure software is licensed under [Apache License 2.0](LICENSE). Third-party scientific assets retain their own licenses, provenance, and attribution requirements; they are not covered by the software license. See [scientific asset licensing](docs/ASSET_LICENSING.md) and [third-party asset notices](packages/assets/THIRD_PARTY_ASSETS.md).
