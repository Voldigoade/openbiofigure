import { z } from "zod";
import { projectAssetSchema } from "../assets/schema";

export const FORMAT_VERSION = "1.0.0" as const;

const commonObjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  scaleX: z.number().positive(),
  scaleY: z.number().positive(),
  angle: z.number().finite(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  fill: z.string().nullable(),
  stroke: z.string().nullable(),
  strokeWidth: z.number().min(0),
});

const rectObjectSchema = commonObjectSchema.extend({ kind: z.literal("rect") });
const ellipseObjectSchema = commonObjectSchema.extend({
  kind: z.literal("ellipse"),
});
const textObjectSchema = commonObjectSchema.extend({
  kind: z.literal("text"),
  text: z.string(),
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  fontWeight: z.union([z.string(), z.number()]),
  textAlign: z.enum(["left", "center", "right", "justify"]),
});
const lineObjectSchema = commonObjectSchema.extend({
  kind: z.enum(["line", "arrow", "connector"]),
  points: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});
const svgObjectSchema = commonObjectSchema.extend({
  kind: z.literal("svg"),
  assetId: z.string().min(1),
});

export type ProjectObject =
  | z.infer<typeof rectObjectSchema>
  | z.infer<typeof ellipseObjectSchema>
  | z.infer<typeof textObjectSchema>
  | z.infer<typeof lineObjectSchema>
  | z.infer<typeof svgObjectSchema>
  | (z.infer<typeof commonObjectSchema> & {
      kind: "group";
      children: ProjectObject[];
    });

export const projectObjectSchema: z.ZodType<ProjectObject> = z.lazy(() =>
  z.union([
    rectObjectSchema,
    ellipseObjectSchema,
    textObjectSchema,
    lineObjectSchema,
    svgObjectSchema,
    commonObjectSchema.extend({
      kind: z.literal("group"),
      children: z.array(projectObjectSchema),
    }),
  ]),
);

export const openBioFigureProjectSchema = z.object({
  formatVersion: z.literal(FORMAT_VERSION),
  metadata: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    applicationVersion: z.string().min(1),
  }),
  document: z.object({
    width: z.number().int().min(100).max(10_000),
    height: z.number().int().min(100).max(10_000),
    unit: z.literal("px"),
    background: z.string().min(1),
    preset: z.string().min(1),
  }),
  objects: z.array(projectObjectSchema),
  assets: z.array(projectAssetSchema),
  settings: z.object({
    grid: z.object({
      enabled: z.boolean(),
      size: z.number().int().min(2).max(200),
      snap: z.boolean(),
    }),
    locale: z.enum(["en", "fr"]),
  }),
});

export type OpenBioFigureProject = z.infer<typeof openBioFigureProjectSchema>;

export function parseProject(value: unknown): OpenBioFigureProject {
  return openBioFigureProjectSchema.parse(value);
}
