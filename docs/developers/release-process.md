# Release process

Official releases are CI-only. A public version tag starts the restricted GitHub Actions release workflow on a clean hosted runner. Locked dependencies are installed, source/privacy/assets/tests/build gates run, the Windows Tauri application is built and launched through its native smoke test, and only then are production installers packaged.

The workflow publishes the NSIS installer, MSI, static archive, SHA-256 file, SPDX SBOM, build information, and GitHub artifact attestations. Local binaries are development output and must never be committed, pushed, or attached to a release.

Release notes describe actual behavior and known limitations. Existing history is not rewritten to hide regressions.
