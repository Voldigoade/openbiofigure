# ADR-004: Tauri desktop runtime

- Status: accepted
- Date: 2026-09-04

## Context

OpenBioFigure must remain a self-hostable static web application while also offering a Windows application that works without a network connection. The desktop shell needs native open/save dialogs but does not need a backend, shell execution, or unrestricted filesystem access.

## Decision

Use Tauri 2 as a thin desktop shell around the existing Vite build. Keep editing, persistence, validation, sanitization, and exports in the shared TypeScript application.

The main window receives only these capabilities:

- Tauri core defaults;
- open and save dialogs;
- text-file reads and writes;
- binary-file writes for PNG export.

Dialog-selected paths are added to the filesystem scope for the current process. OpenBioFigure does not grant a broad home-directory scope and does not include shell, network, updater, or process plugins.

Windows releases produce both NSIS (`.exe`) and WiX (`.msi`) installers. They embed Microsoft WebView2's offline installer so initial installation does not require network access. This increases each installer by roughly 130 MB before packaging compression.

## Consequences

- Browser and desktop builds share one product implementation and project format.
- Web users keep standard browser downloads; desktop users get native file dialogs.
- The desktop binary can run fully offline, including the bundled verified asset catalog.
- Windows packaging is slower and larger than a bootstrapper that downloads WebView2.
- Code signing is not yet available; release checksums and GitHub build provenance attestations provide verifiable integrity until a signing identity is configured.

## Alternatives considered

- Electron: mature but materially larger and grants a broader Node-oriented runtime than required.
- A native rewrite: would duplicate the editor and slow web/desktop parity.
- Online WebView2 bootstrapper: smaller, but fails the offline-install requirement.
