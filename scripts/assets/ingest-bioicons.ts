import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { z } from "zod";
import { sanitizeSvg } from "../../src/domain/assets/sanitize";
import {
  assetMetadataSchema,
  type AssetMetadata,
} from "../../src/domain/assets/schema";

const providerSchema = z.object({
  id: z.literal("bioicons"),
  label: z.string().min(1),
  repository: z.string().regex(/^[^/]+\/[^/]+$/),
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  retrievedAt: z.iso.date(),
  licenseDirectory: z.string().min(1),
  license: z.object({
    id: z.literal("CC0-1.0"),
    name: z.string().min(1),
    url: z.string().url(),
    attributionRequired: z.literal(false),
  }),
  maxSourceBytes: z.number().int().positive(),
  upstreamReadme: z.string().url(),
});

const treeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      sha: z.string(),
      size: z.number().int().nonnegative().optional(),
    }),
  ),
});

const upstreamIconSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  license: z.string().min(1),
  author: z.string().min(1),
});

const root = process.cwd();
const catalogPath = resolve(root, "packages/assets/catalog.json");
const svgDirectory = resolve(root, "packages/assets/svg");
const reportPath = resolve(
  root,
  "packages/assets/generated/bioicons-ingestion.json",
);
const providerPath = resolve(root, "packages/assets/providers/bioicons.json");
const provider = providerSchema.parse(
  JSON.parse(await readFile(providerPath, "utf8")) as unknown,
);

const headers: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "OpenBioFigure-asset-ingestion",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (process.env.GITHUB_TOKEN)
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers });
  if (!response.ok)
    throw new Error(`Upstream request failed (${response.status}): ${url}`);
  return response.json() as Promise<unknown>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok)
    throw new Error(`Upstream request failed (${response.status}): ${url}`);
  return response.text();
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function humanize(value: string) {
  const spaced = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced ? spaced[0]!.toUpperCase() + spaced.slice(1) : value;
}

const rawBase = `https://raw.githubusercontent.com/${provider.repository}/${provider.revision}/`;
const apiBase = `https://api.github.com/repos/${provider.repository}`;
const tree = treeSchema.parse(
  await fetchJson(`${apiBase}/git/trees/${provider.revision}?recursive=1`),
);
if (tree.truncated)
  throw new Error(
    "The upstream Git tree response is truncated; ingestion stopped.",
  );

const [iconsValue, authorsValue] = await Promise.all([
  fetchJson(`${rawBase}static/icons/icons.json`),
  fetchJson(`${rawBase}static/icons/authors.json`),
]);
const upstreamIcons = upstreamIconSchema.array().parse(iconsValue);
const authors = z.record(z.string(), z.string()).parse(authorsValue);
const iconsByKey = new Map<string, z.infer<typeof upstreamIconSchema>[]>();
for (const icon of upstreamIcons.filter((item) => item.license === "cc-0")) {
  const key = `${icon.category}\0${icon.name}`;
  iconsByKey.set(key, [...(iconsByKey.get(key) ?? []), icon]);
}

function safeAuthorUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const candidates = tree.tree
  .filter(
    (entry) =>
      entry.type === "blob" &&
      entry.path.startsWith(`${provider.licenseDirectory}/`) &&
      entry.path.toLowerCase().endsWith(".svg") &&
      (entry.size ?? Number.POSITIVE_INFINITY) <= provider.maxSourceBytes,
  )
  .sort((left, right) => left.path.localeCompare(right.path));

const existing = assetMetadataSchema
  .array()
  .parse(JSON.parse(await readFile(catalogPath, "utf8")) as unknown);
const sourcePaths = new Set(existing.map((asset) => asset.source.upstreamPath));
const digests = new Set(existing.map((asset) => asset.integrity));
const additions: AssetMetadata[] = [];
const duplicatePaths: string[] = [];
const rejectedPaths: { path: string; reason: string }[] = [];
let alreadyPresent = 0;
const dom = new JSDOM("<!doctype html>");

async function ingest(entry: (typeof candidates)[number]) {
  const segments = entry.path.split("/");
  const fileName = segments.at(-1)!;
  const name = fileName.replace(/\.svg$/i, "");
  const metadataName = name.replace(/\.(?:drawio|inkscape)$/i, "");
  const author = segments.at(-2)!;
  const category = segments.at(-3)!;
  const matchingIcons = iconsByKey.get(`${category}\0${metadataName}`) ?? [];
  const upstreamIcon =
    matchingIcons.find((icon) => slug(icon.author) === slug(author)) ??
    (matchingIcons.length === 1 ? matchingIcons[0] : undefined);
  if (!upstreamIcon) {
    rejectedPaths.push({
      path: entry.path,
      reason: "No matching entry in the pinned upstream icons.json metadata.",
    });
    return;
  }
  if (
    /^(?:null|unknown|n\/?a|none|anonymous|-)$/i.test(
      upstreamIcon.author.trim(),
    )
  ) {
    rejectedPaths.push({
      path: entry.path,
      reason: "The pinned upstream metadata does not identify a creator.",
    });
    return;
  }
  if (sourcePaths.has(entry.path)) {
    alreadyPresent += 1;
    return;
  }

  const upstreamSvg = await fetchText(`${rawBase}${encodePath(entry.path)}`);
  const sanitized = sanitizeSvg(upstreamSvg, dom.window).svg;
  const digest = `sha256-${createHash("sha256").update(sanitized).digest("hex").toUpperCase()}`;
  if (digests.has(digest)) {
    duplicatePaths.push(entry.path);
    return;
  }

  const pathKey = createHash("sha256")
    .update(entry.path)
    .digest("hex")
    .slice(0, 8);
  const localStem = [
    slug(category).slice(0, 24),
    slug(author).slice(0, 24),
    slug(name).slice(0, 48),
    pathKey,
  ]
    .filter(Boolean)
    .join("-");
  const localFile = `${localStem}.svg`;
  const title = humanize(metadataName);
  const creatorName = upstreamIcon.author;
  const categoryName = humanize(category);
  const tokens = [
    ...new Set([...metadataName.split(/[_-]+/), ...category.split(/[_-]+/)]),
  ]
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 1);
  const sourceUrl = `https://github.com/${provider.repository}/blob/${provider.revision}/${encodePath(entry.path)}`;
  const assetUrl = `${rawBase}${encodePath(entry.path)}`;
  const asset = assetMetadataSchema.parse({
    id: `bioicons-${localStem}`,
    title,
    description: `${title}, a reusable scientific vector illustration from Bioicons.`,
    keywords: tokens,
    category: categoryName,
    file: localFile,
    integrity: digest,
    source: {
      provider: provider.label,
      sourceUrl,
      assetUrl,
      retrievedAt: provider.retrievedAt,
      revision: provider.revision,
      upstreamPath: entry.path,
    },
    creator: {
      name: creatorName,
      url: safeAuthorUrl(authors[creatorName] ?? authors[author]),
    },
    license: provider.license,
    attribution: {
      text: `${title} by ${creatorName}, distributed via Bioicons under CC0 1.0.`,
      modified: false,
      modificationNotes: null,
    },
  });
  await writeFile(resolve(svgDirectory, localFile), sanitized, "utf8");
  additions.push(asset);
  sourcePaths.add(entry.path);
  digests.add(digest);
}

const concurrency = 8;
for (let offset = 0; offset < candidates.length; offset += concurrency) {
  await Promise.all(candidates.slice(offset, offset + concurrency).map(ingest));
}

const catalog = [...existing, ...additions].sort((left, right) =>
  left.id.localeCompare(right.id),
);
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      provider: provider.id,
      repository: provider.repository,
      revision: provider.revision,
      retrievedAt: provider.retrievedAt,
      policy: {
        licenseDirectory: provider.licenseDirectory,
        maxSourceBytes: provider.maxSourceBytes,
      },
      candidates: candidates.length,
      alreadyPresent,
      newlyImported: additions.length,
      duplicateContentsSkipped: duplicatePaths.sort(),
      rejected: rejectedPaths.sort((left, right) =>
        left.path.localeCompare(right.path),
      ),
      catalogTotal: catalog.length,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `Bioicons ingestion complete: ${additions.length} added, ${alreadyPresent} already present, ${duplicatePaths.length} duplicate contents skipped, ${rejectedPaths.length} rejected, ${catalog.length} total.`,
);
