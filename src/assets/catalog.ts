import rawCatalog from "../../packages/assets/catalog.json";
import {
  assetMetadataSchema,
  type AssetMetadata,
  type AssetProvider,
} from "../domain/assets/schema";

const svgModules = import.meta.glob<string>("../../packages/assets/svg/*.svg", {
  eager: true,
  import: "default",
  query: "?url",
});
const svgUrlByFile = Object.fromEntries(
  Object.entries(svgModules).map(([path, url]) => [
    path.split("/").at(-1)!,
    url,
  ]),
);

export function getSeedAssetUrl(asset: AssetMetadata): string {
  const url = svgUrlByFile[asset.file];
  if (!url) throw new Error(`Missing SVG for asset ${asset.id}.`);
  return url;
}

export async function getSeedSvg(asset: AssetMetadata): Promise<string> {
  const response = await fetch(getSeedAssetUrl(asset));
  if (!response.ok)
    throw new Error(`Unable to load SVG for asset ${asset.id}.`);
  return response.text();
}

export const seedCatalog = assetMetadataSchema.array().parse(rawCatalog);

export class VerifiedSeedProvider implements AssetProvider {
  readonly id = "verified-seed";
  readonly label = "Verified seed catalog";

  list(): Promise<AssetMetadata[]> {
    return Promise.resolve(seedCatalog);
  }

  loadSvg(asset: AssetMetadata): Promise<string> {
    return getSeedSvg(asset);
  }
}

export const seedProvider = new VerifiedSeedProvider();
