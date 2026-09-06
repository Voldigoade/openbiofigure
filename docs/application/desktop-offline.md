# Desktop app and offline use

The Windows application packages the same local-first editor in a Tauri shell. It adds native open and save dialogs without requiring an account, backend, or broad filesystem access.

After installation, you can launch the app, create a figure, search the bundled catalog, edit, save, reopen, and export without a network connection. External documentation and GitHub links naturally require connectivity.

The web application also supports offline use after its resources have loaded and the service worker has completed setup. Keep portable `.obf.json` backups because browser storage belongs to one browser profile.
