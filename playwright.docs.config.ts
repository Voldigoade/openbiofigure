import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/docs-e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4174/openbiofigure/docs/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm docs:build && pnpm docs:preview --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174/openbiofigure/docs/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
