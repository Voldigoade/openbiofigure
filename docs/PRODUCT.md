# Product definition

## Target users

Researchers, doctoral candidates, science students, biology and biomedical professionals, educators, laboratories, and authors who need editable scientific figures.

## Problem

Scientific figures are commonly assembled across proprietary or disconnected tools. Finding reusable illustrations, checking their rights, preserving credits, and keeping compositions editable are separate manual tasks that are easy to get wrong.

## Value proposition

OpenBioFigure combines local vector composition with a provider-independent scientific asset catalog. Each placed asset carries structured provenance and licensing metadata, enabling a publication check and generated attribution ledger alongside SVG/PNG output.

## Current limitations

- The editor is desktop-first; mobile can use Home and Settings but presents guidance instead of the full canvas workspace.
- The verified offline catalog contains 410 Bioicons assets, but it is not a comprehensive scientific library and currently represents one provider.
- Connectors are editable straight lines without semantic anchoring or automatic routing.
- Vector PDF, chemical structure authoring, collaboration, and optional sync are not implemented. V0.2 charts intentionally cover straightforward non-negative bar and line datasets rather than statistical analysis.
- Imported user SVG metadata is self-declared and is flagged when incomplete or unknown.
- Accessibility is strongest in the application shell; direct canvas object manipulation remains visually oriented.
- OpenBioFigure tracks metadata and does not determine legal compatibility or provide legal advice.

## V0.2 product surface

- A first-run Home offers New, Open, autosave recovery, recent projects, and three editable scientific templates.
- The verified Bioicons catalog supports ranked search, source/license filters, favorites, recent use, click-to-add, and drag-and-drop.
- Built-in editable drawing groups cover a cell, phospholipid bilayer, DNA, figure panel, and scale bar.
- Users can create editable bar and line charts from validated local data.
- A publication preflight reviews empty content, title quality, provenance, hidden objects, small text, and modified assets, then exports a Markdown report.

## Product principles

- Open source and self-hostable
- Local-first and privacy-first, with no telemetry by default
- Editable, structured, and vector-first
- Provenance and attribution as core project data
- No account, backend, or AI required
- Accessible controls and keyboard alternatives outside the graphical canvas
- Extensible providers/exporters without coupling the public project format to one rendering engine
