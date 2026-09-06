import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import YAML from "yaml";

const root = process.cwd();
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}

await walk(root);
for (const file of files.filter((path) =>
  [".yml", ".yaml", ".cff"].includes(extname(path)),
)) {
  YAML.parse(await readFile(file, "utf8"));
}

const citation = YAML.parse(
  await readFile(resolve(root, "CITATION.cff"), "utf8"),
);
if (
  citation["cff-version"] !== "1.2.0" ||
  citation.license !== "Apache-2.0" ||
  citation.authors?.[0]?.["family-names"] !== "Voldigoade"
) {
  throw new Error("CITATION.cff is missing required public metadata.");
}

for (const file of files.filter((path) => extname(path) === ".md")) {
  const markdown = await readFile(file, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (!target || /^(?:https?:|mailto:|#|<)/.test(target)) continue;
    const local = decodeURIComponent(target.split("#")[0]);
    if (!local) continue;
    const candidates = local.startsWith("/")
      ? [
          resolve(root, "docs", local.slice(1)),
          resolve(root, "docs", `${local.slice(1)}.md`),
          resolve(root, "docs", local.slice(1), "index.md"),
          resolve(root, "docs", "public", local.slice(1)),
        ]
      : [resolve(dirname(file), local)];
    const exists = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          await stat(candidate);
          return true;
        } catch {
          return false;
        }
      }),
    );
    if (!exists.some(Boolean)) {
      throw new Error(`Broken local Markdown link in ${file}: ${target}`);
    }
  }
}

console.log("YAML, CITATION.cff, and local Markdown links are valid.");
