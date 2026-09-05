import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { browser } from "@wdio/globals";

const appBinaryPath =
  process.env.OPENBIOFIGURE_DESKTOP_BINARY ??
  resolve("src-tauri/target/release/openbiofigure.exe");
const webviewUserDataPath = resolve("test-results/desktop/webview-user-data");

export const config = {
  runner: "local",
  specs: ["./tests/desktop/**/*.spec.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: appBinaryPath,
        webviewOptions: {
          userDataFolder: webviewUserDataPath,
        },
      },
    },
  ],
  services: [
    [
      "@wdio/tauri-service",
      {
        appBinaryPath,
        driverProvider: "external",
        autoInstallTauriDriver: true,
        autoDownloadEdgeDriver: true,
        captureBackendLogs: false,
        // Frontend log capture requires the optional WebdriverIO Tauri plugin to
        // be embedded in the application. Release builds intentionally omit it.
        captureFrontendLogs: false,
        backendLogLevel: "info",
        frontendLogLevel: "warn",
        startTimeout: 120_000,
      },
    ],
  ],
  framework: "mocha",
  reporters: ["spec"],
  logLevel: "info",
  bail: 1,
  waitforTimeout: 20_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 2,
  mochaOpts: {
    ui: "bdd",
    timeout: 120_000,
  },
  onPrepare: () => {
    rmSync(webviewUserDataPath, { force: true, recursive: true });
  },
  onComplete: () => {
    rmSync(webviewUserDataPath, { force: true, recursive: true });
  },
  afterTest: async (
    _test: unknown,
    _context: unknown,
    result: { passed: boolean },
  ) => {
    if (!result.passed) {
      await browser
        .saveScreenshot("test-results/desktop/desktop-smoke-failure.png")
        .catch(() => undefined);
    }
  },
  outputDir: "test-results/desktop",
};
