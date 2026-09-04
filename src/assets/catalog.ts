import bacteriumSvg from "../../packages/assets/svg/bacterium.svg?raw";
import microscopeSvg from "../../packages/assets/svg/microscope.svg?raw";
import mitochondrionSvg from "../../packages/assets/svg/mitochondrion.svg?raw";
import phageSvg from "../../packages/assets/svg/phage.svg?raw";
import rawCatalog from "../../packages/assets/catalog.json";
import {
  assetMetadataSchema,
  type AssetMetadata,
  type AssetProvider,
} from "../domain/assets/schema";

const svgByFile: Record<string, string> = {
  "bacterium.svg": bacteriumSvg,
  "microscope.svg": microscopeSvg,
  "mitochondrion.svg": mitochondrionSvg,
  "phage.svg": phageSvg,
};

export function getSeedSvg(asset: AssetMetadata): string {
  const svg = svgByFile[asset.file];
  if (!svg) throw new Error(`Missing SVG for asset ${asset.id}.`);
  return svg;
}

export const seedCatalog = assetMetadataSchema.array().parse(rawCatalog);

export class VerifiedSeedProvider implements AssetProvider {
  readonly id = "verified-seed";
  readonly label = "Verified seed catalog";

  list(): Promise<AssetMetadata[]> {
    return Promise.resolve(seedCatalog);
  }

  loadSvg(asset: AssetMetadata): Promise<string> {
    return Promise.resolve(getSeedSvg(asset));
  }
}

export const seedProvider = new VerifiedSeedProvider();
