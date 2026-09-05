# Windows desktop application

OpenBioFigure uses Tauri 2 as a least-privilege shell around the same local-first editor shipped on the web.

## Development

Install Node.js 20+, pnpm 11, the stable Rust toolchain, and the Windows prerequisites listed in the [Tauri documentation](https://v2.tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm desktop:check
pnpm desktop:dev
pnpm desktop:build:test
pnpm test:e2e:desktop
```

## Packaging

```bash
pnpm desktop:build
```

The command builds:

- an offline NSIS setup executable in `src-tauri/target/release/bundle/nsis/`;
- an offline WiX MSI in `src-tauri/target/release/bundle/msi/`.

Both include the Microsoft WebView2 offline installer. Release automation generates SHA-256 checksums, an SPDX JSON SBOM, and GitHub build provenance attestations.

Local packages are for development validation only and must never be distributed or attached to a release. Official downloads are rebuilt from the tagged commit on a clean GitHub-hosted runner. See [release trust and verification](RELEASES.md).

## Packaged runtime and offline assets

The web build registers a versioned service worker for PWA use. The Tauri runtime does not: it starts from a release-versioned local URL, unregisters stale workers, and clears only Cache Storage. IndexedDB and local preferences are preserved. This prevents an old cached HTML shell from requesting JavaScript chunks that no longer exist after an upgrade.

Bundled catalog SVGs are fetched from the application's own origin. The desktop CSP allows that self-origin fetch plus Tauri IPC; it does not grant general Internet access. The native smoke test verifies an asset can be searched, loaded, placed, and associated with complete provenance.

## Security boundary

The desktop shell exposes no command execution and no unrestricted directory scope. It can read or write only files explicitly selected through the native open/save dialog during the current process. The authoritative capability definition is [`src-tauri/capabilities/main.json`](../src-tauri/capabilities/main.json).

The static web application remains fully supported and does not depend on Tauri.
