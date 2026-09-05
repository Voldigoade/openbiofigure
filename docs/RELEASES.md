# Release trust and verification

## Official build origin

Official OpenBioFigure artifacts are built only by the repository's `Release` GitHub Actions workflow after a version tag is pushed. A clean GitHub-hosted `windows-latest` runner checks out the exact tagged commit, installs locked pnpm and Cargo dependencies, runs the source policy and test suite, and invokes the official Tauri GitHub Action.

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
Get-FileHash .\OpenBioFigure_0.2.0_x64-setup.exe -Algorithm SHA256
```

Compare the displayed hash with the corresponding line in `SHA256SUMS.txt`.

## Verify GitHub artifact provenance

Install the GitHub CLI, then run:

```bash
gh attestation verify OpenBioFigure_0.2.0_x64-setup.exe \
  --repo Voldigoade/openbiofigure \
  --signer-workflow Voldigoade/openbiofigure/.github/workflows/release.yml
```

GitHub verifies the Sigstore-backed attestation and reports the source repository, commit SHA, and workflow identity. The same command works for the MSI and static archive by replacing the filename.
