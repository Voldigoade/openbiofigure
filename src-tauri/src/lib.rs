pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init());

    #[cfg(feature = "desktop-e2e")]
    let builder = builder.plugin(tauri_plugin_wdio_webdriver::init());

    builder
        .run(tauri::generate_context!())
        .expect("failed to run OpenBioFigure");
}
