import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { z } from "zod";
import {
  assetMetadataSchema,
  type AssetMetadata,
} from "../../src/domain/assets/schema";
import {
  containsActiveSvgContent,
  sanitizeSvg,
} from "../../src/domain/assets/sanitize";

const root = process.cwd();
const catalogPath = resolve(root, "packages/assets/catalog.json");
const svgDirectory = resolve(root, "packages/assets/svg");
const providerPath = resolve(root, "packages/assets/providers/bioicons.json");
const providerSchema = z.object({
  label: z.string().min(1),
  repository: z.string().regex(/^[^/]+\/[^/]+$/),
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  licenseDirectory: z.string().min(1),
});

const windowsReservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const unknownCreator = /^(?:null|unknown|n\/?a|none|anonymous|-)$/i;
const bioiconsLicenseDirectories: Record<string, string> = {
  "CC0-1.0": "cc-0",
  "CC-BY-3.0": "cc-by-3.0",
};

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function validateCatalog(): Promise<{
  assets: AssetMetadata[];
  licenseCounts: Record<string, number>;
}> {
  const assets = assetMetadataSchema
    .array()
    .parse(JSON.parse(await readFile(catalogPath, "utf8")) as unknown);
  const bioicons = providerSchema.parse(
    JSON.parse(await readFile(providerPath, "utf8")) as unknown,
  );
  const files = (await readdir(svgDirectory))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  const declared = assets.map((asset) => asset.file).sort();
  if (JSON.stringify(files) !== JSON.stringify(declared))
    throw new Error("SVG files and catalog entries do not match exactly.");

  const ids = new Set<string>();
  const hashes = new Set<string>();
  const sources = new Set<string>();
  const sourcePaths = new Set<string>();
  const windowsFiles = new Set<string>();
  const licenseCounts: Record<string, number> = {};
  const dom = new JSDOM("<!doctype html>");
  for (const asset of assets) {
    if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
    if (sources.has(asset.source.sourceUrl))
      throw new Error(`Duplicate source URL: ${asset.source.sourceUrl}`);
    ids.add(asset.id);
    sources.add(asset.source.sourceUrl);
    const windowsFile = asset.file.toLocaleLowerCase("en");
    if (windowsFiles.has(windowsFile))
      throw new Error(`Case-insensitive filename collision: ${asset.file}`);
    if (
      asset.file.length > 120 ||
      windowsReservedName.test(asset.file) ||
      asset.file.endsWith(".") ||
      asset.file.endsWith(" ")
    )
      throw new Error(`Filename is not Windows-safe: ${asset.file}`);
    windowsFiles.add(windowsFile);
    if (sourcePaths.has(asset.source.upstreamPath))
      throw new Error(`Duplicate upstream path: ${asset.source.upstreamPath}`);
    if (
      asset.source.upstreamPath.startsWith("/") ||
      asset.source.upstreamPath.includes("\\") ||
      asset.source.upstreamPath.split("/").includes("..")
    )
      throw new Error(`Unsafe upstream path: ${asset.source.upstreamPath}`);
    sourcePaths.add(asset.source.upstreamPath);
    if (unknownCreator.test(asset.creator.name.trim()))
      throw new Error(`Unidentified creator for ${asset.id}.`);
    if (asset.license.id === "UNKNOWN")
      throw new Error(`Unknown catalog license for ${asset.id}.`);
    if (asset.source.provider === bioicons.label) {
      const licenseDirectory = bioiconsLicenseDirectories[asset.license.id];
      if (!licenseDirectory)
        throw new Error(`Unsupported Bioicons license for ${asset.id}.`);
      if (asset.source.revision !== bioicons.revision)
        throw new Error(`Unpinned Bioicons revision for ${asset.id}.`);
      if (
        !asset.source.upstreamPath.startsWith(
          `static/icons/${licenseDirectory}/`,
        )
      )
        throw new Error(`Bioicons license path mismatch for ${asset.id}.`);
      const encodedPath = encodePath(asset.source.upstreamPath);
      const expectedSource = `https://github.com/${bioicons.repository}/blob/${bioicons.revision}/${encodedPath}`;
      const expectedAsset = `https://raw.githubusercontent.com/${bioicons.repository}/${bioicons.revision}/${encodedPath}`;
      if (
        asset.source.sourceUrl !== expectedSource ||
        asset.source.assetUrl !== expectedAsset
      )
        throw new Error(`Bioicons source URL mismatch for ${asset.id}.`);
    }
    const svg = await readFile(resolve(svgDirectory, asset.file), "utf8");
    const digest = `sha256-${createHash("sha256").update(svg).digest("hex").toUpperCase()}`;
    if (digest !== asset.integrity)
      throw new Error(`Integrity mismatch for ${asset.file}.`);
    if (hashes.has(digest))
      throw new Error(`Duplicate SVG content: ${asset.file}.`);
    hashes.add(digest);
    if (containsActiveSvgContent(svg))
      throw new Error(
        `Active content detected in bundled asset: ${asset.file}.`,
      );
    const sanitized = sanitizeSvg(svg, dom.window);
    if (sanitized.changed)
      throw new Error(`Bundled SVG is not pre-sanitized: ${asset.file}.`);
    if (!asset.license.url || !asset.source.sourceUrl || !asset.creator.name) {
      throw new Error(`Incomplete provenance for ${asset.id}.`);
    }
    licenseCounts[asset.license.id] =
      (licenseCounts[asset.license.id] ?? 0) + 1;
  }
  return { assets, licenseCounts };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = await validateCatalog();
  console.log(`Validated ${result.assets.length} scientific assets.`);
  console.log(
    `Licenses: ${Object.entries(result.licenseCounts)
      .map(([id, count]) => `${id}=${count}`)
      .join(", ")}`,
  );
}
