# Product UX benchmark

This note records the product patterns selected for OpenBioFigure’s V0.3 experience. It is not a visual-copying brief.

## Evidence reviewed

- [BioRender’s official library overview](https://www.biorender.com/library) foregrounds field-specific asset search, editable templates, drag-and-drop, and direct publication/presentation export.
- [BioRender’s official editor guide](https://help.biorender.com/hc/en-gb/articles/17605463050397-Exploring-Icons-Templates-and-Brushes) separates icons, templates, and repeated-symbol brushes—three distinct scientific creation jobs.
- [Figma’s official layer guidance](https://help.figma.com/hc/en-us/articles/26584819173271-Layers-101-Get-started-with-layers) connects canvas selection to contextual position, appearance, and typography controls in the right panel.
- [Figma’s official navigation guidance](https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar) uses stable workspace regions and lets users collapse chrome when the canvas needs priority.
- [Canva’s official editor documentation](https://www.canva.com/help/editing-designing/) groups creation around templates, elements, text, page settings, layers, and charts rather than implementation concepts.
- [Canva’s official export guidance](https://www.canva.com/help/sharing-export-to-canva/) distinguishes editable SVG from flattened raster output in task-oriented language.

## User jobs

1. Start from a useful scientific composition, not an unexplained blank page.
2. Find a recognizable asset by scientific term or category and place it directly.
3. Add explanatory text, arrows, and connectors without switching mental models.
4. Adjust only the properties relevant to the current selection.
5. Keep layer order understandable when a figure becomes complex.
6. Know whether provenance, attribution, dimensions, and export settings are ready for publication.
7. Save and reopen locally, then export an editable master and a submission-ready image.

## Decisions for OpenBioFigure

- Home begins with New figure and Open project, then offers original templates and local recents.
- New figure uses sensible scientific presets and exposes dimensions, units, DPI, background, and template choice without making every decision mandatory.
- The editor retains predictable left library / central canvas / right properties architecture. The inspector is selection-aware; advanced controls stay collapsed until relevant.
- Asset discovery supports search, taxonomy browsing, favorites, recents, provider, and licence filters. Full SVG data remains lazy-loaded.
- Publication readiness is a first-class status with ready, warning, and blocker language. It tracks metadata and never offers legal advice.
- Export language explains SVG for editability and PNG/PDF for output needs, with presets before advanced controls.
- Offline and local-first behavior are product capabilities, not settings theatre: no account, telemetry, or network is required for core work.

## Originality boundary

OpenBioFigure does not copy proprietary interface layouts, templates, illustrations, names, or marketing claims. Benchmarks inform hierarchy and workflow only. Product templates and brand assets must be original or carry independently verified reusable licences.
