# Third-party scientific assets

The 733 bundled scientific SVGs are separate from OpenBioFigure's Apache-2.0 software license. They remain under the terms recorded for each asset in `catalog.json`.

## Catalog snapshot

- Provider: Bioicons
- Assets: 733
- Creators represented: 88
- CC0-1.0: 409 assets; attribution not required
- CC-BY-4.0: 323 assets; attribution required
- CC-BY-3.0: 1 asset; attribution required
- Pinned upstream revision: `d29e766ea7580b8063c4f47b29e872db40a4d979`

`catalog.json` is the machine-readable source of truth for every local filename, source URL, upstream path and revision, creator, license, attribution text, retrieval date, and SHA-256 integrity value. `generated/bioicons-ingestion.json` records the deterministic screening result, including files rejected for missing upstream metadata and duplicate content.

## Example attribution-required asset

| Local file              | Upstream creator    | Provider | License   | Attribution required |
| ----------------------- | ------------------- | -------- | --------- | -------------------- |
| `svg/mitochondrion.svg` | Servier Medical Art | Bioicons | CC BY 3.0 | Yes                  |

Bioicons explicitly instructs users to cite each individual icon and its respective license. The ingestion reads only allowlisted license directories and still requires matching per-asset creator and licence data. The Servier-derived mitochondrion remains recorded as CC BY 3.0 because that is the licence attached to this specific Bioicons copy; OpenBioFigure does not retroactively apply different collection-wide terms.
