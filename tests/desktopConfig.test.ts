import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface TauriConfiguration {
  app: {
    security: {
      csp: Record<string, string>;
    };
    windows: Array<{ url?: string }>;
  };
}

const configuration = JSON.parse(
  readFileSync(resolve("src-tauri/tauri.conf.json"), "utf8"),
) as TauriConfiguration;

describe("desktop release configuration", () => {
  it("allows packaged catalog assets to be fetched only from the app origin", () => {
    const connectSources = configuration.app.security.csp["connect-src"];

    expect(connectSources?.split(/\s+/)).toContain("'self'");
    expect(connectSources).not.toMatch(/https?:\/\/(?!ipc\.localhost)/);
  });

  it("uses a versioned recovery URL for persistent WebView profiles", () => {
    expect(configuration.app.windows[0]?.url).toMatch(
      /^index\.html\?desktop-recovery=\d+\.\d+\.\d+$/,
    );
  });
});
