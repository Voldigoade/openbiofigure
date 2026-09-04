import { z } from "zod";

const absoluteUrl = z.string().url();

export const assetLicenseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: absoluteUrl.nullable(),
  attributionRequired: z.boolean(),
});

export const assetMetadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  category: z.string().min(1),
  file: z.string().regex(/^[a-zA-Z0-9._-]+\.svg$/),
  integrity: z.string().regex(/^sha256-[A-F0-9]{64}$/),
  source: z.object({
    provider: z.string().min(1),
    sourceUrl: absoluteUrl,
    assetUrl: absoluteUrl,
    retrievedAt: z.iso.date(),
  }),
  creator: z.object({
    name: z.string().min(1),
    url: absoluteUrl.nullable(),
  }),
  license: assetLicenseSchema,
  attribution: z.object({
    text: z.string().min(1),
    modified: z.boolean(),
    modificationNotes: z.string().min(1).nullable(),
  }),
});

export const projectAssetSchema = assetMetadataSchema
  .omit({ file: true, integrity: true, source: true })
  .extend({
    source: z.object({
      provider: z.string().min(1),
      sourceUrl: absoluteUrl.nullable(),
      assetUrl: absoluteUrl.nullable(),
      retrievedAt: z.iso.date(),
    }),
    svg: z.string().min(1),
    verified: z.boolean(),
  });

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export type ProjectAsset = z.infer<typeof projectAssetSchema>;
export type AssetLicense = z.infer<typeof assetLicenseSchema>;

export interface AssetProvider {
  readonly id: string;
  readonly label: string;
  list(): Promise<AssetMetadata[]>;
  loadSvg(asset: AssetMetadata): Promise<string>;
}
