# Verify a release

Verification is optional for ordinary installation but useful for security-sensitive environments.

## SHA-256

Download the artifact and `SHA256SUMS.txt` from the same release. In PowerShell:

```powershell
Get-FileHash .\OpenBioFigure_0.2.1_x64-setup.exe -Algorithm SHA256
```

Compare the result with the matching line in `SHA256SUMS.txt`.

## GitHub artifact attestation

With GitHub CLI installed:

```bash
gh attestation verify OpenBioFigure_0.2.1_x64-setup.exe \
  --repo Voldigoade/openbiofigure \
  --signer-workflow Voldigoade/openbiofigure/.github/workflows/release.yml
```

A successful result identifies the source repository, exact commit, and workflow. OpenBioFigure does not currently claim Windows Authenticode signing.
