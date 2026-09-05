import { generateAttributions } from "../licensing/attribution";
import type { OpenBioFigureProject } from "../project/schema";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export function safeFileStem(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "openbiofigure"
  );
}

export function buildProjectJson(project: OpenBioFigureProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function buildSvgExport(
  canvasSvg: string,
  project: OpenBioFigureProject,
): string {
  const attribution = generateAttributions(project);
  const metadata = escapeXml(
    JSON.stringify({
      generator: "OpenBioFigure 0.2.0",
      projectFormat: project.formatVersion,
      title: project.metadata.title,
      attributions: attribution.check.assets.map((asset) => ({
        id: asset.id,
        creator: asset.creator.name,
        license: asset.license.id,
        source: asset.source.sourceUrl,
        attribution: asset.attribution.text,
        modified: asset.attribution.modified,
      })),
    }),
  );
  return canvasSvg.replace(
    /(<svg\b[^>]*>)/,
    `$1<metadata id="openbiofigure-metadata">${metadata}</metadata>`,
  );
}

export function makeDownload(
  content: BlobPart,
  type: string,
  filename: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
