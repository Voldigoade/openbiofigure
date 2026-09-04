# Security policy

## Supported versions

Security fixes target the current `main` branch and, once published, the latest V0.1 release. Earlier development snapshots are not supported.

## Report a vulnerability

Use GitHub private vulnerability reporting in the repository **Security** tab. Do not open a public issue for an undisclosed vulnerability. Include the affected version/files, minimal reproduction, impact, and suggested mitigation when known. Never attach real patient, research, credential, or personal data.

No response-time guarantee is made at this early stage, but reports will be assessed and coordinated responsibly.

## In scope

- malicious or unexpectedly executable project/uploaded files;
- unsafe SVG content, parser bypasses, scripts, event handlers, `foreignObject`, unsafe URLs, or external resource loads;
- corrupted or oversized project data;
- compromised, typosquatted, or unexpectedly modified dependencies;
- leakage of local projects, provenance records, credentials, or browser data;
- export content that bypasses sanitization.
- desktop capability, native-dialog, installer, or file-scope bypasses.

OpenBioFigure treats project files, imported SVGs, metadata, and dependencies as potentially untrusted. See [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) for controls and known limitations.
