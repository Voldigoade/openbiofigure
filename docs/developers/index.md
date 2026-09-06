# Developer documentation

OpenBioFigure is a browser-first React and TypeScript application with a thin Tauri desktop shell. Domain models remain independent of Fabric.js, and the application requires no backend.

## Start locally

```bash
git clone https://github.com/Voldigoade/openbiofigure.git
cd openbiofigure
pnpm install
pnpm dev
```

Use `pnpm verify` before opening a pull request. It checks formatting, lint, strict types, tests, asset integrity, documentation, privacy, source policy, and production builds.

## Read next

- [Architecture](/ARCHITECTURE) explains boundaries and data flow.
- [Project format](/PROJECT_FORMAT) defines the public editable model.
- [Asset pipeline](/developers/asset-pipeline) covers deterministic catalog generation.
- [Security model](/SECURITY_MODEL) documents trust boundaries.
- [Contributing](/developers/contributing) describes contribution expectations.
