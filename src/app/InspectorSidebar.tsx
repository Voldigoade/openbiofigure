import { Check, Layers3, Shapes } from "lucide-react";
import type { InspectorTab } from "./types";
import type { PublicationCheck } from "../domain/licensing/attribution";
import type { OpenBioFigureProject } from "../domain/project/schema";
import type {
  FabricEditor,
  LayerSnapshot,
  SelectionSnapshot,
} from "../editor/FabricEditor";
import { LayersPanel } from "../features/inspector/LayersPanel";
import { PropertyInspector } from "../features/inspector/PropertyInspector";
import { LicensingPanel } from "../features/licensing/LicensingPanel";

interface InspectorSidebarProps {
  tab: InspectorTab;
  project: OpenBioFigureProject;
  selection: SelectionSnapshot | null;
  layers: LayerSnapshot[];
  publication: PublicationCheck;
  styleLabel: string;
  layersLabel: string;
  getEditor: () => FabricEditor | null;
  onTabChange: (tab: InspectorTab) => void;
  onExportAttributions: (format: "markdown" | "text") => void;
  onExportPublicationReport: () => void;
}

export function InspectorSidebar({
  tab,
  project,
  selection,
  layers,
  publication,
  styleLabel,
  layersLabel,
  getEditor,
  onTabChange,
  onExportAttributions,
  onExportPublicationReport,
}: InspectorSidebarProps) {
  return (
    <aside className="right-panel" aria-label="Figure inspector">
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="Inspector panels"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "properties"}
          onClick={() => onTabChange("properties")}
        >
          <Shapes />
          {styleLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "layers"}
          onClick={() => onTabChange("layers")}
        >
          <Layers3 />
          {layersLabel}
          <span>{layers.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "licensing"}
          onClick={() => onTabChange("licensing")}
        >
          <Check />
          License{publication.incompleteCount > 0 && <i>!</i>}
        </button>
      </div>
      {tab === "properties" && (
        <PropertyInspector
          selection={selection}
          onUpdate={(value) => getEditor()?.updateSelection(value)}
          onAlign={(mode) => getEditor()?.align(mode)}
          onDistribute={(axis) => getEditor()?.distribute(axis)}
        />
      )}
      {tab === "layers" && (
        <LayersPanel
          layers={layers}
          onSelect={(id) => getEditor()?.select(id)}
          onToggle={(id, field) => getEditor()?.toggleLayer(id, field)}
          onMove={(id, direction) => getEditor()?.moveLayer(id, direction)}
        />
      )}
      {tab === "licensing" && (
        <LicensingPanel
          project={project}
          onDownload={onExportAttributions}
          onDownloadReport={onExportPublicationReport}
        />
      )}
    </aside>
  );
}
