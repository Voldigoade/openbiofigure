# ADR-006: Individually attributed Bioicons CC BY 4.0 expansion

- Status: accepted
- Date: 2026-09-06

## Context

The CC0-only snapshot established by ADR-005 is useful but misses many biological and laboratory subjects. Bioicons' pinned repository includes a separate `cc-by-4.0` directory and per-icon records in `icons.json`. Its README requires users to cite each icon and its respective licence and to disclose modifications to CC BY material.

## Decision

OpenBioFigure also ingests eligible SVG files from the pinned Bioicons `cc-by-4.0` directory. A file is accepted only when its category, name, creator, and `cc-by-4.0` value match an individual upstream metadata record. The normalized record uses the official CC BY 4.0 licence URL, requires attribution, and preserves the creator, exact upstream path, source URLs, commit, retrieval date, and sanitized-file SHA-256 checksum.

The existing 100 KB source limit, SVG sanitizer, safe-filename rules, and content deduplication remain mandatory. Invalid SVGs, ambiguous metadata, missing creators, and duplicate content are reported rather than admitted. Technical sanitization does not mark an illustration as creatively modified; later user edits do.

CC BY 3.0, CC BY-SA, BSD, and MIT directories are not opened for bulk ingestion by this decision. The single CC BY 3.0 seed asset remains individually reviewed and validated.

## Consequences

- The offline catalog grows from 410 to 733 verified assets.
- 323 new CC BY 4.0 assets carry required attribution through project files and reports.
- The deterministic report records 17 rejected candidates and four duplicate contents across enabled directories.
- Figures using CC BY assets show attribution obligations and modification warnings in the existing publication check.
