import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { Brand } from "./Brand";

interface SettingsScreenProps {
  gridSize: number;
  snapToGrid: boolean;
  recentCount: number;
  onBack: () => void;
  onGridSizeChange: (size: number) => void;
  onSnapChange: (enabled: boolean) => void;
  onClearRecent: () => void;
}

export function SettingsScreen({
  gridSize,
  snapToGrid,
  recentCount,
  onBack,
  onGridSizeChange,
  onSnapChange,
  onClearRecent,
}: SettingsScreenProps) {
  return (
    <main className="settings-screen">
      <header className="start-header">
        <Brand />
        <button className="button quiet" type="button" onClick={onBack}>
          <ArrowLeft /> Back
        </button>
      </header>
      <div className="settings-layout">
        <aside aria-label="Settings sections">
          <h1>Settings</h1>
          <a href="#editor">Editor</a>
          <a href="#files">Files</a>
          <a href="#privacy">Privacy</a>
          <a href="#about">About</a>
        </aside>
        <div className="settings-content">
          <section id="editor">
            <p className="eyebrow">Editor</p>
            <h2>Canvas defaults</h2>
            <label className="settings-row">
              <span>
                <strong>Grid size</strong>
                <small>Spacing used by grid snapping.</small>
              </span>
              <input
                aria-label="Default grid size"
                type="number"
                min="2"
                max="200"
                value={gridSize}
                onChange={(event) =>
                  onGridSizeChange(event.currentTarget.valueAsNumber)
                }
              />
            </label>
            <label className="settings-row">
              <span>
                <strong>Snap to grid</strong>
                <small>Align moved objects to grid intersections.</small>
              </span>
              <input
                aria-label="Snap to grid by default"
                type="checkbox"
                checked={snapToGrid}
                onChange={(event) => onSnapChange(event.currentTarget.checked)}
              />
            </label>
          </section>

          <section id="files">
            <p className="eyebrow">Files</p>
            <h2>Local project history</h2>
            <div className="settings-row">
              <span>
                <strong>Recent projects</strong>
                <small>
                  {recentCount} project{recentCount === 1 ? "" : "s"} stored on
                  this device.
                </small>
              </span>
              <button
                className="button danger-outline"
                type="button"
                disabled={recentCount === 0}
                onClick={onClearRecent}
              >
                <Trash2 /> Clear list
              </button>
            </div>
          </section>

          <section id="privacy">
            <p className="eyebrow">Privacy</p>
            <h2>Local-first by design</h2>
            <p>
              Projects, recent files, and bundled asset search stay on this
              device. OpenBioFigure has no account requirement and no telemetry.
            </p>
          </section>

          <section id="about">
            <p className="eyebrow">About</p>
            <h2>OpenBioFigure v0.2</h2>
            <p>
              Open-source scientific figure editing with provenance-aware
              assets.
            </p>
            <a
              className="inline-link"
              href="https://github.com/Voldigoade/openbiofigure"
              target="_blank"
              rel="noreferrer"
            >
              Project documentation <ExternalLink />
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
