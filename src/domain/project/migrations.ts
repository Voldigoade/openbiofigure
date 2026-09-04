import { createProject } from "./factory";
import {
  FORMAT_VERSION,
  parseProject,
  type OpenBioFigureProject,
} from "./schema";

type LegacyProject = {
  formatVersion?: number | string;
  title?: string;
  document?: Partial<OpenBioFigureProject["document"]>;
  objects?: OpenBioFigureProject["objects"];
  assets?: OpenBioFigureProject["assets"];
};

export function migrateProject(input: unknown): OpenBioFigureProject {
  if (typeof input !== "object" || input === null)
    throw new Error("Project data must be an object.");
  const candidate = input as LegacyProject & Partial<OpenBioFigureProject>;
  if (candidate.formatVersion === FORMAT_VERSION)
    return parseProject(candidate);

  if (candidate.formatVersion === 0 || candidate.formatVersion === "0.1.0") {
    const migrated = createProject("custom", {
      width: candidate.document?.width ?? 1200,
      height: candidate.document?.height ?? 800,
    });
    migrated.metadata.title =
      candidate.title ?? candidate.metadata?.title ?? "Imported figure";
    migrated.document.background = candidate.document?.background ?? "#ffffff";
    migrated.objects = candidate.objects ?? [];
    migrated.assets = candidate.assets ?? [];
    return parseProject(migrated);
  }

  throw new Error(
    `Unsupported project format version: ${String(candidate.formatVersion ?? "missing")}`,
  );
}
