# OpenBioFigure UX contract

This document defines product-wide interaction behavior. Visual values belong to [`DESIGN.md`](DESIGN.md); scientific data and legal constraints remain governed by the relevant ADRs and licensing documentation.

## Core journey

A first-time user must be able to open the product, create a figure, find a scientific asset, add text and an arrow, arrange the composition, save locally, and export without consulting documentation. Advanced controls appear contextually or in clearly named panels.

## Navigation

- Home exposes New figure and Open project first, followed by templates and recent local work.
- Editor preserves familiar File, Edit, View, and Help operations and a stable three-pane workspace.
- Settings is a separate destination with persistent section navigation and a clear return action.
- Normal Documentation actions open the self-hosted documentation portal; Source code is a distinct action.
- Back and Escape never silently discard a user’s only copy of work.

## Canonical capability map

| Capability               | Canonical owner                            | Source of truth                                      | Allowed variants                          | Verification             |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------- | ----------------------------------------- | ------------------------ |
| Buttons and icon actions | shared `.button` and `IconButton` patterns | `src/styles.css`, `src/components/ui/IconButton.tsx` | primary, secondary, quiet, danger         | keyboard and browser E2E |
| Dialogs                  | `useDialogBehavior` plus dialog components | `src/components/dialogs/`                            | document, chart, metadata, shortcuts      | focus and workflow E2E   |
| Menus                    | `ApplicationMenuBar`                       | `src/app/ApplicationMenuBar.tsx`                     | File, Edit, View, Help                    | keyboard and browser E2E |
| Select/Listbox           | browser native                             | labelled finite selects in `src/`                    | finite single-select only                 | keyboard and browser E2E |
| Form                     | `FormField` and labelled native controls   | `src/components/ui/FormField.tsx`                    | dialog and settings forms                 | unit and browser E2E     |
| Scrollbar                | tokenized browser scrollbars               | `src/styles.css`                                     | panel, workspace, page                    | responsive browser E2E   |
| Search                   | `AssetsPanel`                              | `src/features/assets/AssetsPanel.tsx`                | catalog, favorites, recent                | unit and browser E2E     |
| Toast                    | app live region                            | `src/App.tsx`                                        | success, warning, error                   | live-region browser E2E  |
| Theme and density        | application preferences                    | `src/App.tsx`                                        | light, dark, system; comfortable, compact | theme browser E2E        |

## Interaction states

Every product-owned control provides default, hover, pressed, focus-visible, disabled, and applicable busy/selected states. Important touch targets approach 44px; no interactive target is below 24px. Focus is restored after overlays close and is never hidden behind fixed chrome.

## Local persistence and resilience

Autosave reports saving, saved, and failure states in a stable region. Project export remains the portable backup. Invalid project and SVG imports fail closed with an understandable explanation and preserve the current document. Network loss must not block bundled assets, editing, local save, or export.

## Destructive and reversible actions

Object deletion is undoable and does not require a modal. Clearing recent-project history is explicit and does not delete project files. Irreversible future operations must identify scope and consequence and initially focus the safer action.

## Accessibility

The application shell targets WCAG 2.2 AA. Controls have programmatic names, visible focus, keyboard equivalents, and text status. Reduced motion, 200% zoom, light/dark themes, and narrow layouts are part of release QA. Direct graphical canvas manipulation remains a documented limitation and must gain keyboard alternatives incrementally.

## Responsive contract

Desktop is primary. Tablet keeps the editor usable with compressed panels and owned scrolling. Below the supported editor width, Home and Settings remain usable while the editor presents clear guidance instead of clipped controls. Each view has one vertical scroll owner per region.

## Product truth

OpenBioFigure makes no claim of legal advice, cloud backup, collaboration, telemetry-free third-party links, or features that are not implemented. Scientific asset provenance is shown exactly as validated by the catalog pipeline.
