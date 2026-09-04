import { describe, expect, it } from "vitest";
import { getSeedSvg, seedCatalog } from "../src/assets/catalog";
import type { AssetMetadata, ProjectAsset } from "../src/domain/assets/schema";
import {
  buildProjectJson,
  buildSvgExport,
  safeFileStem,
} from "../src/domain/export/exporters";
import {
  checkPublication,
  generateAttributions,
} from "../src/domain/licensing/attribution";
import { createProject } from "../src/domain/project/factory";
import { migrateProject } from "../src/domain/project/migrations";
import { MemoryProjectStorage } from "../src/domain/storage/projectStorage";

function projectAsset(metadata: AssetMetadata): ProjectAsset {
  const { file, integrity, ...asset } = metadata;
  void file;
  void integrity;
  return { ...asset, svg: getSeedSvg(metadata), verified: true };
}

describe("licensing and attribution", () => {
  it("tracks an asset through project, publication check, and attribution outputs", () => {
    const project = createProject();
    const metadata = seedCatalog[0]!;
    project.assets.push(projectAsset(metadata));
    project.objects.push({
      id: "mito-1",
      name: "Mitochondrion",
      kind: "svg",
      assetId: metadata.id,
      x: 300,
      y: 300,
      width: 120,
      height: 220,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: null,
      stroke: null,
      strokeWidth: 0,
    });
    const check = checkPublication(project);
    expect(check).toMatchObject({
      usedAssetCount: 1,
      completeCount: 1,
      incompleteCount: 0,
      ready: true,
    });
    expect(generateAttributions(project).markdown).toContain(
      "Servier Medical Art",
    );
    expect(generateAttributions(project).legend).toContain("CC BY 3.0");
  });

  it("flags unknown licenses and modified assets without inventing data", () => {
    const project = createProject();
    const asset = projectAsset(seedCatalog[1]!);
    asset.id = "user-import";
    asset.license = {
      id: "UNKNOWN",
      name: "Unknown license",
      url: null,
      attributionRequired: false,
    };
    asset.source.sourceUrl = null;
    asset.attribution.modified = true;
    project.assets = [asset];
    project.objects.push({
      id: "user-svg",
      name: "Import",
      kind: "svg",
      assetId: asset.id,
      x: 1,
      y: 1,
      width: 10,
      height: 10,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: null,
      stroke: null,
      strokeWidth: 0,
    });
    const check = checkPublication(project);
    expect(check.ready).toBe(false);
    expect(check.incompleteCount).toBe(1);
    expect(check.modifiedCount).toBe(1);
  });
});

describe("project persistence and exports", () => {
  it("round-trips a versioned project through storage and JSON import", async () => {
    const project = createProject("square");
    project.metadata.title = "Cell pathway";
    const storage = new MemoryProjectStorage();
    await storage.save(project);
    const loaded = await storage.load();
    expect(loaded).toEqual(project);
    expect(
      migrateProject(JSON.parse(buildProjectJson(project)) as unknown),
    ).toEqual(project);
    await storage.clear();
    expect(await storage.load()).toBeNull();
  });

  it("embeds attribution metadata in exported SVG and creates safe filenames", () => {
    const project = createProject();
    project.metadata.title = "Énergie & signal / 01";
    const result = buildSvgExport(
      `<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`,
      project,
    );
    expect(result).toContain("openbiofigure-metadata");
    expect(result).toContain("OpenBioFigure 0.2.0");
    expect(safeFileStem(project.metadata.title)).toBe("energie-signal-01");
  });
});
