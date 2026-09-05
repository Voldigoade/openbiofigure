import { z } from "zod";

const absoluteUrl = z.string().url();

export const assetLicenseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: absoluteUrl.nullable(),
  attributionRequired: z.boolean(),
});

const assetMetadataBaseSchema = z.object({
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
    revision: z.string().min(7),
    upstreamPath: z.string().min(1),
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

function validateModificationState(
  asset: {
    attribution: { modified: boolean; modificationNotes: string | null };
  },
  context: z.RefinementCtx,
) {
  if (
    asset.attribution.modified !== Boolean(asset.attribution.modificationNotes)
  ) {
    context.addIssue({
      code: "custom",
      path: ["attribution", "modificationNotes"],
      message:
        "Modification notes must be present exactly when modified is true.",
    });
  }
}

export const assetMetadataSchema = assetMetadataBaseSchema.superRefine(
  validateModificationState,
);

export const projectAssetSchema = assetMetadataBaseSchema
  .omit({ file: true, integrity: true, source: true })
  .extend({
    source: z.object({
      provider: z.string().min(1),
      sourceUrl: absoluteUrl.nullable(),
      assetUrl: absoluteUrl.nullable(),
      retrievedAt: z.iso.date(),
      revision: z.string().min(7).nullable().optional(),
      upstreamPath: z.string().min(1).nullable().optional(),
    }),
    svg: z.string().min(1),
    verified: z.boolean(),
  })
  .superRefine(validateModificationState);

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export type ProjectAsset = z.infer<typeof projectAssetSchema>;
export type AssetLicense = z.infer<typeof assetLicenseSchema>;

export interface AssetProvider {
  readonly id: string;
  readonly label: string;
  list(): Promise<AssetMetadata[]>;
  loadSvg(asset: AssetMetadata): Promise<string>;
}
