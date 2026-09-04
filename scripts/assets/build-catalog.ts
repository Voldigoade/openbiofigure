import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCatalog } from "./validate-catalog";

const { assets, licenseCounts } = await validateCatalog();
const directory = resolve(process.cwd(), "packages/assets/generated");
await mkdir(directory, { recursive: true });

const index = assets.map((asset) => ({
  id: asset.id,
  text: [
    asset.title,
    asset.description,
    asset.category,
    asset.source.provider,
    asset.license.id,
    ...asset.keywords,
  ]
    .join(" ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase(),
  category: asset.category,
  provider: asset.source.provider,
  license: asset.license.id,
  attributionRequired: asset.license.attributionRequired,
}));
await writeFile(
  resolve(directory, "search-index.json"),
  `${JSON.stringify(index, null, 2)}\n`,
  "utf8",
);

const report = [
  "# Asset catalog report",
  "",
  `- Validated assets: ${assets.length}`,
  `- Providers: ${new Set(assets.map((asset) => asset.source.provider)).size}`,
  `- Licenses: ${Object.entries(licenseCounts)
    .map(([id, count]) => `${id} (${count})`)
    .join(", ")}`,
  `- Attribution required: ${assets.filter((asset) => asset.license.attributionRequired).length}`,
  "- Unknown or incomplete licenses: 0",
  "",
  "Generated deterministically from `catalog.json`; no remote content is fetched.",
  "",
].join("\n");
await writeFile(resolve(directory, "REPORT.md"), report, "utf8");
console.log(`Generated search index and report for ${assets.length} assets.`);
