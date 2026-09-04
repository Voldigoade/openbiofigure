import { Check, Circle, Minus } from "lucide-react";
import type { SaveState } from "./types";
import type { PublicationCheck } from "../domain/licensing/attribution";
import type { SelectionSnapshot } from "../editor/FabricEditor";

interface EditorStatusProps {
  saveState: SaveState;
  selection: SelectionSnapshot | null;
  publication: PublicationCheck;
  labels: {
    saving: string;
    saveFailed: string;
    savedLocally: string;
  };
  onOpenLicensing: () => void;
}

export function EditorStatus({
  saveState,
  selection,
  publication,
  labels,
  onOpenLicensing,
}: EditorStatusProps) {
  return (
    <>
      <footer className="statusbar">
        <span className={`save-status status-${saveState}`}>
          {saveState === "saving"
            ? labels.saving
            : saveState === "error"
              ? labels.saveFailed
              : labels.savedLocally}
        </span>
        <span className="status-center">
          {selection
            ? `${selection.count} selected · ${selection.name}`
            : "Ready · No selection"}
        </span>
        <button
          type="button"
          onClick={onOpenLicensing}
          className={
            publication.ready ? "publication-ready" : "publication-warning"
          }
        >
          {publication.ready ? <Check /> : "!"} {publication.completeCount}/
          {publication.usedAssetCount} assets with complete provenance
        </button>
      </footer>
      <div className="mobile-message">
        <div className="brand-glyph">
          <Circle />
          <Minus />
        </div>
        <h1>OpenBioFigure</h1>
        <p>
          The editor needs a wider screen. Use a tablet or desktop to compose
          figures; saved projects remain local to this browser.
        </p>
      </div>
    </>
  );
}
