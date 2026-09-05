import { resolve } from "node:path";
import { browser } from "@wdio/globals";

const appBinaryPath =
  process.env.OPENBIOFIGURE_DESKTOP_BINARY ??
  resolve("src-tauri/target/release/openbiofigure.exe");
export const config = {
  runner: "local",
  specs: ["./tests/desktop/**/*.spec.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: appBinaryPath,
      },
    },
  ],
  services: [
    [
      "@wdio/tauri-service",
      {
        appBinaryPath,
        driverProvider: "embedded",
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
