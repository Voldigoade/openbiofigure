# Interaction guidelines

## Product context

- Audience: researchers, students, educators, and scientific authors
- Primary jobs: compose an editable figure, reuse licensed scientific SVGs, preserve provenance, save locally, and export
- Active locale: English (`en-US`); an i18n message layer exists for future reviewed translations
- Accessibility target: WCAG 2.2 AA for the application shell; documented limitations apply to direct canvas manipulation

## Visual contract

- `design-system.md` owns design intent and semantic values.
- `src/styles.css` is the runtime CSS adapter and mirrors the semantic token names.
- The light editor theme is the currently supported theme.

## Canonical UI Map

| Capability     | Canonical owner     | Source of truth  | Allowed variants           | Verification          |
| -------------- | ------------------- | ---------------- | -------------------------- | --------------------- |
| Select/Listbox | Browser native      | `src/App.tsx`    | finite native select       | keyboard + E2E        |
| Form           | SVG metadata dialog | `src/App.tsx`    | import metadata            | custom validation E2E |
| Scrollbar      | Browser native      | `src/styles.css` | workspace / panel internal | responsive E2E        |
| Toast          | App status toast    | `src/App.tsx`    | success / warning / error  | live region + E2E     |

Native selects are intentional: the option sets are short and finite, and platform-owned popup geometry, keyboard behavior, and English locale presentation are accepted for supported browsers.

## Interaction and feedback

- Icon buttons have accessible names, visible focus, hover, active, disabled, and explanatory title states.
- Asset cards support drag-and-drop and an explicit Add button alternative.
- Local file imports use labelled file controls and accessible dialogs.
- The SVG metadata form uses `noValidate`, inline custom error feedback, and blocks invalid HTTP(S) source/license URLs.
- Metadata textareas have fixed height and no resize handle inside the bounded dialog.
- Autosave state appears in the persistent status bar; short command feedback uses a polite live-region toast.
- Destructive object deletion is reversible through Undo and therefore has no confirmation modal.

## Navigation and responsive behavior

- Desktop owns the complete three-pane editor.
- Tablet keeps all three panes with condensed toolbar labels and internal panel scrolling.
- Below 720 px, the editor is hidden and a clear desktop/tablet guidance screen is shown.
- The app shell owns the viewport; asset, inspector, and workspace regions own their independent scrollbars.
- Dialogs sit above the editor; toasts sit above dialogs.

## Persistence and resilience

- IndexedDB autosave is pessimistic and reports saving/saved/error states.
- Project export is the durable portable backup; no cloud persistence is implied.
- Invalid projects and SVGs fail closed with recoverable UI feedback.
- Offline use is available after same-origin resources have been cached once.
