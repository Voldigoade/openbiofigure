import {
  ArrowRight,
  FilePlus2,
  FolderOpen,
  Settings,
  Trash2,
} from "lucide-react";
import type { RecentProject } from "../domain/storage/projectStorage";
import type { FigureTemplateId } from "../domain/templates/templates";
import { FIGURE_TEMPLATES } from "../domain/templates/templates";
import { Brand } from "./Brand";

interface StartScreenProps {
  autosave: RecentProject["project"] | null;
  recent: RecentProject[];
  onNew: () => void;
  onOpen: () => void;
  onContinue: () => void;
  onOpenRecent: (project: RecentProject["project"]) => void;
  onRemoveRecent: (projectId: string) => void;
  onCreateTemplate: (templateId: FigureTemplateId) => void;
  onSettings: () => void;
}

function projectDimensions(project: RecentProject["project"]) {
  return `${project.document.width} × ${project.document.height} px · ${project.objects.length} object${project.objects.length === 1 ? "" : "s"}`;
}

export function StartScreen({
  autosave,
  recent,
  onNew,
  onOpen,
  onContinue,
  onOpenRecent,
  onRemoveRecent,
  onCreateTemplate,
  onSettings,
}: StartScreenProps) {
  return (
    <main className="start-screen">
      <header className="start-header">
        <Brand />
        <button className="button quiet" type="button" onClick={onSettings}>
          <Settings /> Settings
        </button>
      </header>

      <div className="start-content">
        <section className="start-intro" aria-labelledby="start-title">
          <p className="eyebrow">Scientific figure editor</p>
          <h1 id="start-title">Create an editable scientific figure</h1>
          <p>
            Compose vector graphics, keep asset provenance attached, and export
            locally. No account or network connection is required.
          </p>
          <div className="start-actions">
            <button
              className="button primary large"
              type="button"
              onClick={onNew}
            >
              <FilePlus2 /> New figure
            </button>
            <button
              className="button secondary large"
              type="button"
              onClick={onOpen}
            >
              <FolderOpen /> Open project
            </button>
          </div>
          {autosave && (
            <button
              className="continue-card"
              type="button"
              onClick={onContinue}
            >
              <span>
                <small>Continue where you left off</small>
                <strong>{autosave.metadata.title}</strong>
                <span>{projectDimensions(autosave)}</span>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          )}
        </section>

        <section className="start-section" aria-labelledby="templates-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Quick start</p>
              <h2 id="templates-title">Figure templates</h2>
            </div>
            <span>Fully editable</span>
          </div>
          <div className="start-template-grid">
            {FIGURE_TEMPLATES.map((template) => (
              <button
                className="start-template"
                type="button"
                onClick={() => onCreateTemplate(template.id)}
                key={template.id}
              >
                <span
                  className={`start-template-preview template-${template.preview}`}
                  style={{
                    aspectRatio: `${template.width}/${template.height}`,
                  }}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{template.title}</strong>
                <small>{template.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section
          className="start-section recent-section"
          aria-labelledby="recent-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Local files</p>
              <h2 id="recent-title">Recent projects</h2>
            </div>
            <span>Stored only on this device</span>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <FolderOpen aria-hidden="true" />
              <div>
                <strong>No recent projects yet</strong>
                <p>Your recent local projects will appear here.</p>
              </div>
            </div>
          ) : (
            <ul className="recent-list">
              {recent.map(({ project, lastOpenedAt }) => (
                <li key={project.metadata.id}>
                  <button type="button" onClick={() => onOpenRecent(project)}>
                    <span className="recent-thumbnail" aria-hidden="true" />
                    <span>
                      <strong>{project.metadata.title}</strong>
                      <small>{projectDimensions(project)}</small>
                    </span>
                    <time dateTime={lastOpenedAt}>
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(lastOpenedAt))}
                    </time>
                  </button>
                  <button
                    className="recent-remove"
                    type="button"
                    aria-label={`Remove ${project.metadata.title} from recent projects`}
                    title="Remove from recent projects"
                    onClick={() => onRemoveRecent(project.metadata.id)}
                  >
                    <Trash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
