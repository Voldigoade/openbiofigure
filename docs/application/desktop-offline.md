# Desktop app and offline use

The Windows application packages the same local-first editor in a Tauri shell. It adds native open and save dialogs without requiring an account, backend, or broad filesystem access.

After installation, you can launch the app, create a figure, search the bundled catalog, edit, save, reopen, and export without a network connection. External documentation and GitHub links naturally require connectivity.

The web application precaches its editor shell and searchable catalog index, so Home, the editor, and catalog search reopen offline after service-worker setup. Individual SVGs are cached when their previews or figures are loaded; an asset that has never been loaded in that browser may therefore need one online visit. The cache keeps the 200 most recently accessed SVGs instead of delaying installation for the entire catalog.

The Windows application is different: all 733 verified SVGs ship inside the installed application and remain insertable with the network disabled. Keep portable `.obf.json` backups in either edition because browser autosave belongs to one profile and is not a substitute for project files.
