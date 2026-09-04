# Windows desktop application

OpenBioFigure uses Tauri 2 as a least-privilege shell around the same local-first editor shipped on the web.

## Development

Install Node.js 20+, pnpm 11, the stable Rust toolchain, and the Windows prerequisites listed in the [Tauri documentation](https://v2.tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm desktop:check
pnpm desktop:dev
```

## Packaging

```bash
pnpm desktop:build
```

The command builds:

- an offline NSIS setup executable in `src-tauri/target/release/bundle/nsis/`;
- an offline WiX MSI in `src-tauri/target/release/bundle/msi/`.

Both include the Microsoft WebView2 offline installer. Release automation generates SHA-256 checksums, an SPDX JSON SBOM, and GitHub build provenance attestations.

## Security boundary

The desktop shell exposes no command execution and no unrestricted directory scope. It can read or write only files explicitly selected through the native open/save dialog during the current process. The authoritative capability definition is [`src-tauri/capabilities/main.json`](../src-tauri/capabilities/main.json).

The static web application remains fully supported and does not depend on Tauri.
