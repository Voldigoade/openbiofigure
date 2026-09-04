# OpenBioFigure project format

V0.1 projects are UTF-8 JSON documents using `.obf.json`. The public model is independent of Fabric.js internals.

## Top-level structure

| Field           | Meaning                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| `formatVersion` | Semantic data-format version; currently `1.0.0`                                   |
| `metadata`      | Project UUID, title, timestamps, and producing app version                        |
| `document`      | Pixel dimensions, background, unit, and selected preset                           |
| `objects`       | Ordered editable object tree, back to front                                       |
| `assets`        | Embedded SVG and full provenance/license records used or available in the project |
| `settings`      | Grid and locale preferences                                                       |

Objects use stable IDs and common transform/style fields. Supported V0.1 kinds are `rect`, `ellipse`, `text`, `line`, `arrow`, `connector`, `svg`, and recursive `group`. SVG objects reference an asset record by `assetId`; raw asset provenance is not duplicated on every object.

## Validation

The Zod schema in `src/domain/project/schema.ts` validates all external project data before use. Dimensions, opacity, scales, URLs, dates, object kinds, and asset records are constrained. Unsupported versions or malformed objects fail closed with an import error.

## Versioning and migrations

- `formatVersion` changes when persisted semantics change, independently of the application version.
- Import always passes through `migrateProject` before current-schema validation.
- V0.1 includes a migration from the early `0`/`0.1.0` development shape to `1.0.0`.
- Future migrations must be deterministic, preserve unknown licensing as unknown, and have fixture tests.
- Writers emit only the current version; readers may support documented older versions.

## Minimal example

```json
{
  "formatVersion": "1.0.0",
  "metadata": {
    "id": "00000000-0000-4000-8000-000000000000",
    "title": "Untitled figure",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "applicationVersion": "0.1.0"
  },
  "document": {
    "width": 1200,
    "height": 800,
    "unit": "px",
    "background": "#ffffff",
    "preset": "journal"
  },
  "objects": [],
  "assets": [],
  "settings": {
    "grid": { "enabled": false, "size": 20, "snap": false },
    "locale": "en"
  }
}
```

The all-zero UUID is illustrative only.
