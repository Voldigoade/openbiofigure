# Release trust and verification

## Official build origin

Official OpenBioFigure artifacts are built only by the repository's `Release` GitHub Actions workflow after a version tag is pushed. A clean GitHub-hosted `windows-latest` runner checks out the exact tagged commit, installs locked pnpm and Cargo dependencies, builds a release-mode application with the test-only embedded WebDriver feature, and launches that real Tauri binary through WebdriverIO. Only after the smoke passes does the official Tauri GitHub Action rebuild the production packages without the test server. The release is not created unless source policy, privacy, asset validation, unit/integration tests, browser tests, and the desktop smoke test all pass.

Local builds are development output only. They are ignored by Git, rejected by the source-tree policy, and must never be attached to a GitHub release.

Each release contains:

- an offline NSIS `setup.exe` and WiX `.msi` built on GitHub Actions;
- a static web archive built on GitHub Actions;
- `SHA256SUMS.txt` covering every downloadable payload;
- an SPDX JSON software bill of materials;
- GitHub artifact attestations binding artifacts to the repository, commit, and workflow run.

The Windows packages embed the WebView2 offline installer. OpenBioFigure does not currently provide Windows Authenticode signatures.

## Verify SHA-256

Download an artifact and `SHA256SUMS.txt` from the same GitHub release. From PowerShell:

```powershell
Get-FileHash .\OpenBioFigure_0.2.1_x64-setup.exe -Algorithm SHA256
```

Compare the displayed hash with the corresponding line in `SHA256SUMS.txt`.

## Verify GitHub artifact provenance

Install the GitHub CLI, then run:

```bash
gh attestation verify OpenBioFigure_0.2.1_x64-setup.exe \
  --repo Voldigoade/openbiofigure \
  --signer-workflow Voldigoade/openbiofigure/.github/workflows/release.yml
```

GitHub verifies the Sigstore-backed attestation and reports the source repository, commit SHA, and workflow identity. The same command works for the MSI and static archive by replacing the filename.

## Desktop launch gate

The Windows job launches `src-tauri/target/release/openbiofigure.exe` with the test-only embedded Tauri WebDriver on the hosted runner. The smoke test must render Home, expose **New figure**, enter the editor, load a bundled scientific asset, and show its provenance. Failure artifacts include the WebdriverIO logs and a screenshot. The embedded server is feature-gated and absent from production packages; packaging and publication are downstream of this gate.

V0.2.0 predated this native launch gate and can retain a stale PWA service-worker shell in an existing WebView2 profile. V0.2.1 is the corrective release; its versioned startup URL bypasses that stale shell, then removes desktop service workers and Cache Storage while preserving user documents and preferences.
