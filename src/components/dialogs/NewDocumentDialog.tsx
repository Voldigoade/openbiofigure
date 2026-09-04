import { X } from "lucide-react";
import { useRef, useState } from "react";
import {
  DOCUMENT_PRESETS,
  type DocumentPreset,
} from "../../domain/project/factory";
import { FormField } from "../ui/FormField";
import { IconButton } from "../ui/IconButton";
import { useDialogBehavior } from "./useDialogBehavior";

interface NewDocumentDialogProps {
  onClose: () => void;
  onCreate: (preset: DocumentPreset, width: number, height: number) => void;
}

export function NewDocumentDialog({
  onClose,
  onCreate,
}: NewDocumentDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogBehavior(dialogRef, onClose);
  const [preset, setPreset] = useState<DocumentPreset>("journal");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const presetOptions: {
    id: DocumentPreset;
    label: string;
    width: number;
    height: number;
  }[] = [
    { id: "square", ...DOCUMENT_PRESETS.square },
    { id: "widescreen", ...DOCUMENT_PRESETS.widescreen },
    { id: "a4-portrait", ...DOCUMENT_PRESETS["a4-portrait"] },
    { id: "a4-landscape", ...DOCUMENT_PRESETS["a4-landscape"] },
    { id: "journal", ...DOCUMENT_PRESETS.journal },
    { id: "custom", label: "Custom", width, height },
  ];

  const updatePreset = (next: DocumentPreset) => {
    setPreset(next);
    if (next !== "custom") {
      setWidth(DOCUMENT_PRESETS[next].width);
      setHeight(DOCUMENT_PRESETS[next].height);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-document-title"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Document setup</p>
            <h2 id="new-document-title">Create a new figure</h2>
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="preset-grid">
          {presetOptions.map(({ id, ...item }) => (
            <button
              type="button"
              className={`preset-card${preset === id ? " is-selected" : ""}`}
              onClick={() => updatePreset(id)}
              key={id}
            >
              <span
                className="preset-preview"
                style={{ aspectRatio: `${item.width}/${item.height}` }}
              />
              <strong>{item.label}</strong>
              <small>
                {id === "custom"
                  ? "Set dimensions"
                  : `${item.width} × ${item.height} px`}
              </small>
            </button>
          ))}
        </div>
        <div className="dialog-fields two-columns">
          <FormField label="Width (px)">
            <input
              type="number"
              min="100"
              max="10000"
              value={width}
              onChange={(event) => {
                setPreset("custom");
                setWidth(event.currentTarget.valueAsNumber);
              }}
            />
          </FormField>
          <FormField label="Height (px)">
            <input
              type="number"
              min="100"
              max="10000"
              value={height}
              onChange={(event) => {
                setPreset("custom");
                setHeight(event.currentTarget.valueAsNumber);
              }}
            />
          </FormField>
        </div>
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => onCreate(preset, width, height)}
            disabled={!width || !height}
          >
            Create figure
          </button>
        </div>
      </section>
    </div>
  );
}
