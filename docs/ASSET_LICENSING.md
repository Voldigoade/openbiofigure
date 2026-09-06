# Scientific asset licensing and provenance

## Separation from the software license

OpenBioFigure code is Apache-2.0. Third-party scientific illustrations are separate works and retain their own terms. Project-created assets, third-party assets, and metadata/provenance are stored and reviewed separately; placing an asset in the editor never relicenses it.

OpenBioFigure helps track licensing metadata; it does not provide legal advice.

## Required asset record

Each catalog asset must include:

- stable `id`, title, description, keywords, and category;
- local filename and SHA-256 integrity hash;
- provider, exact source URL, asset URL, and retrieval date;
- creator name and optional creator URL;
- precise license identifier, name, URL, and whether attribution is required;
- exact attribution text, modification state, and modification notes where applicable.

Unknown or incomplete licensing blocks catalog validation. User-imported SVGs may use `UNKNOWN`, but the publication check then reports the project as incomplete and no license is guessed.

## Verified catalog

The repository distributes 733 reviewed files from [Bioicons](https://bioicons.com/): 409 under CC0-1.0, 323 under CC-BY-4.0, and one Servier Medical Art mitochondrion from Bioicons’ CC-BY-3.0 path. Exact URLs, upstream paths and revisions, creators, licence versions, hashes, and credits are recorded in `packages/assets/catalog.json` and the repository's [third-party asset ledger](https://github.com/Voldigoade/openbiofigure/blob/main/packages/assets/THIRD_PARTY_ASSETS.md).

The Bioicons pipeline uses a pinned signed Git revision, explicitly allowlisted licence directories, a source-size limit, exact per-icon upstream metadata, an identified creator, SVG sanitization, and content deduplication. Seventeen candidate files are deliberately excluded and four duplicate contents are skipped in the deterministic ingestion report. Routine validation is offline and refuses undeclared files, duplicate identifiers/content/source URLs, hash mismatches, active SVG content, licence/path mismatches, and missing provenance.

## Sources for cautious future evaluation

- **Bioicons:** the CC0 and CC-BY-4.0 snapshots above are integrated. Other licence directories remain excluded unless separately reviewed and represented safely.
- **NIH/NIAID BioArt Source:** some assets are public domain while others can require attribution; verify each record.
- **Servier Medical Art:** the current primary collection advertises CC BY 4.0, but downstream copies may carry a different specific version, as the V0.1 Bioicons asset does.
- **SciDraw:** assets advertise CC BY 4.0; review the exact drawing and source record before redistribution.

A collection statement never replaces asset-by-asset verification. Do not mass-scrape, mirror, or transform a source merely because downloads are technically accessible.

## Attribution behavior

Placed assets retain their full records in the project. Export produces a required-credit section and a provenance ledger, deduplicating only exact equivalent credit/license/source combinations. Required credit is never dropped. Modification notes are retained and surfaced in the publication check.
