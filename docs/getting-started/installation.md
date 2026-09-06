# Installation

Choose the web editor for immediate access or the Windows application for a dedicated offline desktop experience. Both use the same project format.

## Recommended: Windows installer

Download **OpenBioFigure setup.exe** from the [Download page](https://voldigoade.github.io/openbiofigure/download/). Run the installer, then open OpenBioFigure from the Start menu. The installer includes the required WebView2 runtime, so the application can launch without downloading it separately.

## Advanced Windows deployment

The MSI is intended for managed or advanced installation. Most people should use `setup.exe`. Both official packages are produced by GitHub Actions; verification details are intentionally kept in [Verify a release](/developers/verify-release).

## Use in a browser

Open the [web editor](https://voldigoade.github.io/openbiofigure/app/). After its resources have loaded once, the installed PWA can continue to work offline. Browser storage is local to that browser profile, so export `.obf.json` backups for work you need to move or archive.

## Build from source

Source builds are for contributors. See [Developer overview](/developers/) for prerequisites and commands.
