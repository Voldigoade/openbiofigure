import { describe, expect, it } from "vitest";
import { createProject, DOCUMENT_PRESETS } from "../src/domain/project/factory";
import { ProjectHistory } from "../src/domain/project/history";
import { migrateProject } from "../src/domain/project/migrations";
import { openBioFigureProjectSchema } from "../src/domain/project/schema";
import {
  createTemplateProject,
  FIGURE_TEMPLATES,
} from "../src/domain/templates/templates";
import {
  createScientificElement,
  type ScientificElementKind,
} from "../src/domain/scientific/elements";
import {
  createChartObject,
  validateChartSpec,
} from "../src/domain/charts/chart";

describe("project model", () => {
  it("creates valid, editable projects from every bundled template", () => {
    for (const template of FIGURE_TEMPLATES) {
      const project = createTemplateProject(template.id);
      expect(openBioFigureProjectSchema.parse(project)).toEqual(project);
      expect(project.objects.length).toBeGreaterThan(5);
      expect(project.document.preset).toBe(`template:${template.id}`);
    }
  });

  it("creates schema-valid editable scientific elements", () => {
    const kinds: ScientificElementKind[] = [
      "cell",
      "membrane",
      "dna",
      "panel",
      "scale-bar",
    ];
    for (const kind of kinds) {
      const project = createProject();
      project.objects.push(createScientificElement(kind, 600, 400));
      expect(openBioFigureProjectSchema.safeParse(project).success).toBe(true);
    }
  });

  it("creates valid bar and line charts and rejects mismatched data", () => {
    for (const kind of ["bar", "line"] as const) {
      const project = createProject();
      project.objects.push(
        createChartObject(
          {
            kind,
            title: "Results",
            labels: ["Control", "Treatment"],
            values: [12, 24],
          },
          600,
          400,
        ),
      );
      expect(openBioFigureProjectSchema.safeParse(project).success).toBe(true);
    }
    expect(
      validateChartSpec({
        kind: "bar",
        title: "Results",
        labels: ["Control", "Treatment"],
        values: [12],
      }),
    ).toContain("same number");
  });

  it("creates a valid project for every document preset", () => {
    for (const [preset, dimensions] of Object.entries(DOCUMENT_PRESETS)) {
      const project = createProject(preset as keyof typeof DOCUMENT_PRESETS);
      expect(openBioFigureProjectSchema.safeParse(project).success).toBe(true);
      expect(project.document).toMatchObject({
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  });

  it("rejects malformed objects at the public format boundary", () => {
    const project = createProject();
    project.objects.push({ kind: "rect", id: "bad" } as never);
    const result = openBioFigureProjectSchema.safeParse(project);
    expect(result.success).toBe(false);
  });

  it("migrates the legacy 0.1 format", () => {
    const migrated = migrateProject({
      formatVersion: "0.1.0",
      title: "Legacy figure",
      document: { width: 900, height: 600 },
    });
    expect(migrated.formatVersion).toBe("1.0.0");
    expect(migrated.metadata.title).toBe("Legacy figure");
    expect(migrated.document).toMatchObject({ width: 900, height: 600 });
  });

  it("preserves bounded undo and redo history", () => {
    const initial = createProject();
    const history = new ProjectHistory(initial, 2);
    for (const title of ["One", "Two", "Three"]) {
      const next = history.current;
      next.metadata.title = title;
      history.push(next);
    }
    expect(history.undo()?.metadata.title).toBe("Two");
    expect(history.undo()?.metadata.title).toBe("One");
    expect(history.undo()).toBeNull();
    expect(history.redo()?.metadata.title).toBe("Two");
  });
});
