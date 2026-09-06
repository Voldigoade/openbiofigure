---
version: 0.3-draft
name: "OpenBioFigure"
description: "A modern scientific editorial workspace for editable figures and traceable assets."
colors:
  document: "#ffffff"
  workspace: "#e8eeeb"
  surface: "#fbfcfb"
  surface-muted: "#f3f6f4"
  text: "#1c2926"
  text-muted: "#52615d"
  border: "#d3dcd8"
  primary: "#087568"
  primary-soft: "#dff3ed"
  focus: "#157bc1"
  success: "#2e7650"
  warning: "#956011"
  danger: "#b33d44"
typography:
  ui:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
  scientific:
    fontFamily: "STIX Two Text, Georgia, serif"
  technical:
    fontFamily: "IBM Plex Mono, Cascadia Mono, monospace"
rounded:
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.625rem"
  lg: "0.875rem"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  12: "3rem"
components:
  workspace:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.text}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  muted-panel:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
  separator:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text}"
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.document}"
    rounded: "{rounded.sm}"
  selected-control:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  focus-state:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.document}"
  success-state:
    backgroundColor: "{colors.success}"
    textColor: "{colors.document}"
  warning-state:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.document}"
  danger-state:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.document}"
---

# OpenBioFigure design system

## Direction

OpenBioFigure is a **modern scientific editorial workspace**: precise enough for publication work, calm enough for long sessions, and approachable to someone making a first figure. Its visual metaphor is a well-organized laboratory bench placed on a publication grid. The signature motif is a restrained provenance thread—object, source, and licence connected—used in brand and trust moments, never as decoration over the canvas.

The product register is a professional productivity application. The white figure document remains visually dominant. Application chrome uses cool neutral surfaces, one-pixel boundaries, compact but legible controls, and teal only for primary actions, selection, and provenance. Blue is reserved for keyboard focus; green, amber, and red retain semantic meaning.

## Canonical ownership

This file owns accepted visual intent. [`src/design-system.css`](src/design-system.css) is the runtime token source and must match the values and roles documented here. [`UX-CONTRACT.md`](UX-CONTRACT.md) owns interaction behavior. Shared React components consume semantic tokens rather than raw colour values.

## Typography

- **IBM Plex Sans** is the application face. It is used for navigation, controls, body copy, and headings.
- **IBM Plex Mono** is reserved for dimensions, zoom, coordinates, shortcuts, file formats, and version identifiers.
- **STIX Two Text** is the scientific-document face for figure text and editorial examples, not a decorative marketing serif.
- Product body text starts at 14px. Compact metadata may use 12px; 11px is limited to secondary captions. Essential controls must not rely on tiny uppercase text.
- Sentence case is the default. Uppercase is limited to short technical keys and panel labels.

All three families are bundled locally, work offline, and are distributed under the SIL Open Font License 1.1. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Colour and themes

Light and dark themes are designed as separate tonal systems rather than inverted colours. The document surface remains white in both themes because it represents exported page content. Dark application chrome uses green-charcoal surfaces, restrained contrast, and brighter semantic accents. System theme follows the operating-system preference.

Focus is never conveyed by colour alone: interactive controls use a 2px outline plus a reserved focus halo. Forced-colour mode must defer to system colours.

## Layout and density

Home, Editor, and Settings are the three primary product surfaces. The editor keeps a left scientific library, a dominant central canvas, a contextual right inspector, and a compact status region. Comfortable density is the default; compact density may reduce whitespace but never target size below the accessible minimum.

Spacing follows the 4px scale in the token file. Standard controls are 36px high, prominent actions are 44px, and icon-only controls remain at least 32px on desktop. Borders and tonal planes establish hierarchy; cards are used only for discrete selectable objects such as templates.

## Shape, depth, and iconography

Radii range from 4px for dense controls to 14px for major overlays. Pills are reserved for statuses and compact filters. Static panels do not float. Document, menus, and dialogs use progressively stronger shadows.

Lucide outline icons are canonical. Ambiguous or important actions keep visible text. Icons use consistent 16–18px geometry and never substitute for a scientific illustration.

## Motion

Motion communicates reveal, selection, insertion, or navigation state in 120–240ms. Standard easing is used for routine state changes; emphasized easing is limited to major view transitions. `prefers-reduced-motion` and the product Reduce Motion preference collapse non-essential animation.

## Content principles

Copy is direct, factual, and supportive. Prefer “Create figure”, “Open project”, and “Export SVG” over vague labels. Licensing language describes tracked metadata and never implies legal advice. Empty states offer one relevant next action; errors explain what happened, preserve work, and expose technical details only when useful.

## Guardrails

- Keep the canvas visually dominant and the basic create → arrange → export workflow obvious.
- Use progressive disclosure for advanced scientific and publication controls.
- Do not add ornamental gradients, glass panels, generic dashboard cards, fake metrics, testimonials, or AI-first language.
- Do not introduce remote fonts, tracking, or theme-specific raw colour literals in components.
- New primitives must define default, hover, pressed, focus-visible, disabled, busy, and dark-theme states.
