import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
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

export async function validateCatalog(): Promise<{
  assets: AssetMetadata[];
  licenseCounts: Record<string, number>;
}> {
  const assets = assetMetadataSchema
    .array()
    .parse(JSON.parse(await readFile(catalogPath, "utf8")) as unknown);
  const files = (await readdir(svgDirectory))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  const declared = assets.map((asset) => asset.file).sort();
  if (JSON.stringify(files) !== JSON.stringify(declared))
    throw new Error("SVG files and catalog entries do not match exactly.");

  const ids = new Set<string>();
  const hashes = new Set<string>();
  const sources = new Set<string>();
  const licenseCounts: Record<string, number> = {};
  const dom = new JSDOM("<!doctype html>");
  for (const asset of assets) {
    if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
    if (sources.has(asset.source.sourceUrl))
      throw new Error(`Duplicate source URL: ${asset.source.sourceUrl}`);
    ids.add(asset.id);
    sources.add(asset.source.sourceUrl);
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
