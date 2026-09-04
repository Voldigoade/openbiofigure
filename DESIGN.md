---
version: alpha
name: "OpenBioFigure"
description: "A scientific vector workbench combining precise editing with visible provenance proofing."
colors:
  canvas: "#ffffff"
  workspace: "#e7ecee"
  surface: "#f6f8f9"
  surface-strong: "#e8edef"
  text: "#263238"
  text-muted: "#5d6b70"
  border: "#d5dde0"
  primary: "#087f8c"
  primary-soft: "#dff4f5"
  selection: "#087f8c"
  success: "#26734d"
  warning: "#9a5c00"
  danger: "#b33a3a"
  focus: "#00a7b7"
typography:
  ui:
    fontFamily: "Inter, Aptos, Segoe UI, system-ui, sans-serif"
  document:
    fontFamily: "Charter, Cambria, Georgia, serif"
  utility:
    fontFamily: "IBM Plex Mono, Cascadia Mono, Consolas, monospace"
rounded:
  DEFAULT: "0.375rem"
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  control-gap: "0.375rem"
  panel-padding: "0.875rem"
  section-gap: "1rem"
components:
  toolbar: {}
  panel: {}
  button: {}
  field: {}
  status-bar: {}
  dialog: {}
---

# OpenBioFigure Design System

## Overview

### Creative North Star

The interface is a digital microscopy workbench crossed with a journal proofing desk: precise instrument-like controls surround a calm white paper surface, while provenance behaves like a visible editorial proof mark.

### Product context and register

- **Audience and primary job:** researchers, students, teachers, and scientific communicators composing editable figures while retaining licensing evidence.
- **Target markets and evidence:** general international research and education, as defined in `docs/PRODUCT.md`.
- **Locales and language policy:** English is the only exposed V0.1 locale. The message layer includes an initial French foundation, but a complete reviewed translation is future work and is not presented as complete.
- **Usage scene:** repeated desktop and tablet work with dense controls, keyboard shortcuts, and a large visual document.
- **Register:** product. Task clarity and familiar editor conventions lead.
- **Memorable signature:** a thin cyan provenance rail ties selected scientific assets to their licensing record and publication check.
- **Restraint:** canvas, toolbar, forms, and layer controls remain quiet, flat, and predictable.
- **Anti-references:** no marketing hero, glassmorphism, playful sticker UI, AI-generation framing, or oversized card dashboard.
- **Token ownership/runtime mapping:** this file is the design source. `src/styles.css` mirrors these semantic tokens as CSS custom properties; shared UI classes and React components consume only those variables.

## Colors

True white is reserved for the figure document. Cool neutral workspace and surface tones separate chrome without heavy shadows. Teal is the main action and provenance color; blue is reserved for object selection/focus, amber for reviewable licensing warnings, red for errors, and green for confirmed checks. Forced-color mode yields to system colors.

## Typography

The compact humanist UI stack supports dense controls at 12–14px. Document text uses a restrained scientific-publication serif option, while dimensions, coordinates, zoom, and file-format labels use the utility mono stack. Sentence case is required; uppercase is limited to short metadata keys.

## Layout

The desktop shell uses a 52px top toolbar, 260px asset panel, flexible workspace, 300px inspector, and 30px status bar. Tablet panels contract before controls wrap. Below 720px, the full editor is replaced by an honest small-screen notice. Scroll ownership belongs to each panel and to the central workspace, never the document body.

## Elevation & Depth

Hierarchy comes from tonal planes and one-pixel borders. The document has a restrained shadow to distinguish paper from the workspace. Dialogs may use a stronger shadow. Static panels and controls do not float.

## Shapes

Controls use 4–8px radii and precise one-pixel outlines. Pills are not a general container style. Icons are Lucide outlines at 16–18px with consistent strokes.

## Components

### Foundational visual states

Hover changes tone, focus uses a visible 2px blue ring, selected controls combine color and border, and disabled controls reduce contrast and pointer affordance. Busy and save states use stable regions with text equivalents.

### Buttons and actions

Buttons combine emphasis and intent. Export actions use teal-accented outlines; ordinary tools are ghost or outline; deletion uses red only in destructive context. Icon-only buttons always receive accessible names and browser-native title hints.

### Navigation and data display

Panels are open rails rather than cards. Assets use a compact two-column catalogue; layers use full-width rows with visible selection, eye, lock, and reorder alternatives. The status bar reports local save state, zoom, and provenance completeness.

### Forms and overlays

Fields use associated labels and native controls where platform-owned popup geometry is acceptable. Application-owned modal surfaces use explicit dialog semantics, bounded internal scrolling, and visible close/cancel actions. File inputs always remain available alongside drag-and-drop.

### Iconography

Lucide outline icons are the canonical family. Text labels remain for primary actions and ambiguous scientific operations.

### Motion

Motion is limited to 120–180ms state feedback and dialog opacity/scale. It communicates selection or reveal and is removed under reduced-motion preferences.

### Content and data visualization

Copy is direct and factual. The application never claims legal certainty: licensing copy consistently says metadata is tracked and users remain responsible for checking intended use.

## Do's and Don'ts

- **Do:** keep the paper canvas visually dominant and editing controls compact.
- **Do:** expose provenance alongside every scientific asset workflow.
- **Don't:** turn licensing status into decorative badges or unsupported guarantees.
- **Don't:** add ornamental gradients, nested cards, fake metrics, or AI-first language.
