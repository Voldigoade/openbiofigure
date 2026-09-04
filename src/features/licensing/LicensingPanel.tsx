import { Check, FileDown, Link2 } from "lucide-react";
import { useMemo } from "react";
import { generateAttributions } from "../../domain/licensing/attribution";
import type { OpenBioFigureProject } from "../../domain/project/schema";

interface LicensingPanelProps {
  project: OpenBioFigureProject;
  onDownload: (format: "markdown" | "text") => void;
}

export function LicensingPanel({ project, onDownload }: LicensingPanelProps) {
  const result = useMemo(() => generateAttributions(project), [project]);
  const check = result.check;

  return (
    <div className="licensing-panel" data-testid="publication-check">
      <div
        className={`publication-score${check.ready ? " is-ready" : " has-warning"}`}
      >
        <span className="score-icon">{check.ready ? <Check /> : "!"}</span>
        <div>
          <strong>Publication check</strong>
          <span>{check.ready ? "Provenance complete" : "Review required"}</span>
        </div>
      </div>
      <ul className="check-list">
        <li>
          <Check /> {check.completeCount} of {check.usedAssetCount} used assets
          have complete provenance
        </li>
        {Object.entries(check.licenseCounts).map(([license, count]) => (
          <li key={license}>
            <Check /> {count} × {license}
          </li>
        ))}
        {check.warnings.map((warning) => (
          <li className="warning-row" key={warning}>
            ! {warning}
          </li>
        ))}
        {!check.usedAssetCount && <li>No scientific asset is used yet.</li>}
      </ul>
      {check.assets.map((asset) => (
        <article className="credit-card" key={asset.id}>
          <div>
            <strong>{asset.title}</strong>
            <span>{asset.creator.name}</span>
          </div>
          <span className="license-pill">{asset.license.id}</span>
          <p>{asset.attribution.text}</p>
          {asset.source.sourceUrl && (
            <a href={asset.source.sourceUrl} target="_blank" rel="noreferrer">
              Original source <Link2 />
            </a>
          )}
        </article>
      ))}
      <div className="attribution-actions">
        <button
          type="button"
          className="button secondary"
          onClick={() => onDownload("markdown")}
          disabled={!check.usedAssetCount}
        >
          <FileDown /> ATTRIBUTIONS.md
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => onDownload("text")}
          disabled={!check.usedAssetCount}
        >
          <FileDown /> Attribution.txt
        </button>
      </div>
      <p className="legal-note">
        OpenBioFigure helps track licensing metadata; it does not provide legal
        advice.
      </p>
    </div>
  );
}
