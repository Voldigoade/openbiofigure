import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { seedCatalog } from "../src/assets/catalog";
import {
  containsActiveSvgContent,
  sanitizeSvg,
} from "../src/domain/assets/sanitize";
import { searchAssets } from "../src/domain/assets/search";
import {
  loadAssetLibraryState,
  recordRecentAsset,
  saveAssetLibraryState,
  toggleFavorite,
} from "../src/domain/assets/libraryState";
import { validateCatalog } from "../scripts/assets/validate-catalog";

describe("asset catalog", () => {
  it("validates every bundled file, hash, license, and provenance record", async () => {
    const result = await validateCatalog();
    expect(result.assets).toHaveLength(410);
    expect(result.licenseCounts).toEqual({
      "CC-BY-3.0": 1,
      "CC0-1.0": 409,
    });
  }, 20_000);

  it("searches title, keywords, category, provider, license and attribution", () => {
    const base = {
      query: "mitochondria",
      category: "",
      provider: "",
      license: "",
      attribution: "all" as const,
    };
    const queryResults = searchAssets(seedCatalog, base);
    expect(queryResults.map((asset) => asset.title)).toContain("Mitochondrion");
    const categoryResults = searchAssets(seedCatalog, {
      ...base,
      query: "",
      category: "Microbiology",
    });
    expect(categoryResults.length).toBeGreaterThan(0);
    expect(
      categoryResults.every((asset) => asset.category === "Microbiology"),
    ).toBe(true);
    const licenseResults = searchAssets(seedCatalog, {
      ...base,
      query: "",
      license: "CC0-1.0",
      attribution: "not-required",
    });
    expect(licenseResults.length).toBe(409);
    expect(
      licenseResults.every(
        (asset) =>
          asset.license.id === "CC0-1.0" && !asset.license.attributionRequired,
      ),
    ).toBe(true);
    expect(
      searchAssets(seedCatalog, { ...base, query: "", provider: "Other" }),
    ).toHaveLength(0);
  });

  it("ranks title matches ahead of description-only matches", () => {
    const results = searchAssets(seedCatalog, {
      query: "mitochondrion",
      category: "",
      provider: "",
      license: "",
      attribution: "all",
    });
    expect(results[0]?.title).toBe("Mitochondrion");
  });

  it("persists favorites and bounded recent assets without duplicates", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    let state = loadAssetLibraryState(storage);
    state = toggleFavorite(state, "asset-a");
    state = recordRecentAsset(state, "asset-a");
    state = recordRecentAsset(state, "asset-b");
    state = recordRecentAsset(state, "asset-a");
    saveAssetLibraryState(storage, state);

    expect(loadAssetLibraryState(storage)).toEqual({
      favorites: ["asset-a"],
      recent: ["asset-a", "asset-b"],
    });
  });
});

describe("SVG sanitizer", () => {
  const dom = new JSDOM("<!doctype html>");
  const sanitize = (svg: string) => sanitizeSvg(svg, dom.window);

  it("removes scripts, event handlers, foreignObject, and javascript URLs", () => {
    const malicious = `<svg xmlns="http://www.w3.org/2000/svg" onload="steal()"><script>alert(1)</script><foreignObject><div>active</div></foreignObject><a href="javascript:steal()"><rect width="10" height="10"/></a></svg>`;
    expect(containsActiveSvgContent(malicious)).toBe(true);
    const result = sanitize(malicious);
    expect(result.changed).toBe(true);
    expect(result.svg).not.toMatch(/script|foreignObject|onload|javascript:/i);
    expect(result.svg).toContain("<rect");
  });

  it("removes external references and unsafe CSS URLs", () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg"><image href="https://tracker.invalid/pixel"/><rect style="fill:url(https://tracker.invalid/x)"/></svg>`;
    const result = sanitize(input);
    expect(result.svg).not.toContain("tracker.invalid");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("rejects non-SVG and oversized input", () => {
    expect(() => sanitize("<html></html>")).toThrow("valid SVG");
    expect(() => sanitize(`<svg>${" ".repeat(2_000_001)}</svg>`)).toThrow(
      "2 MB",
    );
  });
});
