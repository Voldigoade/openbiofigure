import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { seedCatalog } from "../src/assets/catalog";
import {
  containsActiveSvgContent,
  sanitizeSvg,
} from "../src/domain/assets/sanitize";
import { searchAssets } from "../src/domain/assets/search";
import { validateCatalog } from "../scripts/assets/validate-catalog";

describe("asset catalog", () => {
  it("validates every bundled file, hash, license, and provenance record", async () => {
    const result = await validateCatalog();
    expect(result.assets).toHaveLength(4);
    expect(result.licenseCounts).toEqual({ "CC-BY-3.0": 1, "CC0-1.0": 3 });
  });

  it("searches title, keywords, category, provider, license and attribution", () => {
    const base = {
      query: "mitochondria",
      category: "",
      provider: "",
      license: "",
      attribution: "all" as const,
    };
    expect(searchAssets(seedCatalog, base).map((asset) => asset.title)).toEqual(
      ["Mitochondrion"],
    );
    expect(
      searchAssets(seedCatalog, {
        ...base,
        query: "",
        category: "Microbiology",
      }),
    ).toHaveLength(2);
    expect(
      searchAssets(seedCatalog, {
        ...base,
        query: "",
        license: "CC0-1.0",
        attribution: "not-required",
      }),
    ).toHaveLength(3);
    expect(
      searchAssets(seedCatalog, { ...base, query: "", provider: "Other" }),
    ).toHaveLength(0);
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
