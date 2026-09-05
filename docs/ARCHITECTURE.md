# Architecture

OpenBioFigure is a local-first React application delivered both as a static website and through a thin Tauri desktop shell. All editing, validation, search, persistence, and export happen locally; no backend, account, telemetry, or AI service is required.

## Boundaries

```text
React application shell
  ├─ FabricEditor adapter ── Fabric.js canvas
  ├─ domain/project ──────── versioned engine-independent model
  ├─ domain/assets ───────── schemas, sanitizer, search, providers
  ├─ domain/licensing ────── publication checks and attribution
  ├─ domain/storage ──────── IndexedDB autosave
  └─ domain/export ───────── OBF JSON, SVG metadata, downloads

Tauri desktop shell
  └─ scoped native dialogs ─ project/SVG open and project/SVG/PNG/credits save

packages/assets + scripts/assets
  └─ pinned provider policies, verified files, provenance, ingestion, safety validation
```

React state updates on committed canvas changes and selection changes, not on every pointer movement. Fabric owns the high-frequency interactive rendering loop. The adapter maps objects to `OpenBioFigureProject`; Fabric’s internal serialization is never the public format.

## Data flow

1. A catalog provider returns validated normalized metadata and sanitized SVG.
2. Placing an asset embeds its metadata and SVG in the local project.
3. The editor serializes committed object state into the versioned project model.
4. IndexedDB autosave stores that model; `.obf.json` uses the same validated contract.
5. Publication checks derive only from assets actually referenced by canvas objects.
6. SVG export embeds a machine-readable provenance summary; attribution files contain the complete ledger.

## Extension points

- `AssetProvider` for optional catalog sources
- engine adapter boundary for rendering/editing
- versioned migrations for project format evolution
- domain export helpers for future PDF/journal exporters
- object `kind` union for future scientific shapes, charts, chemical structures, and panels

New extensions must preserve offline usefulness and must not weaken provenance or SVG-safety controls.

## Runtime and deployment

Vite builds static files to `dist/`. Scientific SVGs are emitted as separate static resources instead of being embedded in the initial JavaScript bundle. A small service worker precaches same-origin application and catalog resources for offline use. IndexedDB stores the current autosave and recent projects. The static output is self-hostable and compatible with GitHub Pages or any static host.

Tauri 2 packages the same output for Windows with native user-selected file dialogs and no broad filesystem or shell capability. Offline NSIS and MSI installers embed WebView2. See [ADR-004](architecture/ADR-004-desktop-runtime.md) and the [desktop build guide](DESKTOP.md).

The bundled Bioicons snapshot is governed by [ADR-005](architecture/ADR-005-bioicons-catalog-ingestion.md). Adding another provider requires a provider-specific ingestion policy; the normalized runtime contract remains `AssetProvider`.
