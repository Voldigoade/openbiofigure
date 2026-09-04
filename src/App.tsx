import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  BoxSelect,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FilePlus2,
  FolderOpen,
  GripVertical,
  Group,
  Hand,
  ImageDown,
  Layers3,
  Link2,
  Lock,
  Minus,
  MousePointer2,
  Redo2,
  Search,
  Shapes,
  Square,
  TextCursorInput,
  Trash2,
  Undo2,
  Ungroup,
  Unlock,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSeedSvg, seedCatalog, seedProvider } from "./assets/catalog";
import { sanitizeSvg } from "./domain/assets/sanitize";
import { searchAssets, type AssetFilters } from "./domain/assets/search";
import type { AssetMetadata, ProjectAsset } from "./domain/assets/schema";
import {
  buildProjectJson,
  buildSvgExport,
  makeDownload,
  safeFileStem,
} from "./domain/export/exporters";
import {
  checkPublication,
  generateAttributions,
} from "./domain/licensing/attribution";
import {
  createProject,
  DOCUMENT_PRESETS,
  type DocumentPreset,
} from "./domain/project/factory";
import { ProjectHistory } from "./domain/project/history";
import { migrateProject } from "./domain/project/migrations";
import type { OpenBioFigureProject } from "./domain/project/schema";
import { IndexedDbProjectStorage } from "./domain/storage/projectStorage";
import {
  FabricEditor,
  type LayerSnapshot,
  type SelectionSnapshot,
} from "./editor/FabricEditor";
import { messages, t, type Locale } from "./i18n/messages";

type InspectorTab = "properties" | "layers" | "licensing";
type SaveState = "idle" | "saving" | "saved" | "error";

const storage = new IndexedDbProjectStorage();
const defaultFilters: AssetFilters = {
  query: "",
  category: "",
  provider: "",
  license: "",
  attribution: "all",
};

function IconButton({
  label,
  children,
  onClick,
  disabled,
  active,
  testId,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function useDialogBehavior(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      ref.current
        ?.querySelector<HTMLElement>("button, input, textarea, select")
        ?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !ref.current) return;
      const focusable = [
        ...ref.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)",
        ),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [ref]);
}

function NewDocumentDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (preset: DocumentPreset, width: number, height: number) => void;
}) {
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

interface PendingSvg {
  fileName: string;
  svg: string;
  changed: boolean;
}

function SvgMetadataDialog({
  pending,
  onClose,
  onImport,
}: {
  pending: PendingSvg;
  onClose: () => void;
  onImport: (asset: ProjectAsset) => void;
}) {
  const dialogRef = useRef<HTMLFormElement>(null);
  useDialogBehavior(dialogRef, onClose);
  const [title, setTitle] = useState(pending.fileName.replace(/\.svg$/i, ""));
  const [creator, setCreator] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [licenseId, setLicenseId] = useState("UNKNOWN");
  const [licenseName, setLicenseName] = useState("Unknown license");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [attributionRequired, setAttributionRequired] = useState(false);
  const [attribution, setAttribution] = useState("");
  const [validationError, setValidationError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validUrl = (value: string) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    };
    if (!title.trim()) {
      setValidationError("Asset title is required.");
      return;
    }
    if (!validUrl(sourceUrl) || !validUrl(licenseUrl)) {
      setValidationError("Source and license URLs must be valid HTTP(S) URLs.");
      return;
    }
    setValidationError("");
    const known =
      licenseId !== "UNKNOWN" && Boolean(sourceUrl && licenseUrl && creator);
    onImport({
      id: `user-${globalThis.crypto.randomUUID()}`,
      title: title || "Imported SVG",
      description: "User-imported scientific SVG.",
      keywords: ["user import"],
      category: "User imports",
      source: {
        provider: "User import",
        sourceUrl: sourceUrl || null,
        assetUrl: sourceUrl || null,
        retrievedAt: new Date().toISOString().slice(0, 10),
      },
      creator: { name: creator || "Unknown creator", url: null },
      license: {
        id: licenseId || "UNKNOWN",
        name: licenseName || "Unknown license",
        url: licenseUrl || null,
        attributionRequired,
      },
      attribution: {
        text: attribution || "Attribution details not supplied",
        modified: pending.changed,
        modificationNotes: pending.changed
          ? "Active SVG content was removed during import."
          : null,
      },
      svg: pending.svg,
      verified: known,
    });
  };
  return (
    <div className="dialog-backdrop" role="presentation">
      <form
        ref={dialogRef}
        className="dialog metadata-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="svg-metadata-title"
        onSubmit={submit}
        noValidate
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Safe SVG import</p>
            <h2 id="svg-metadata-title">Provenance metadata</h2>
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <p className="dialog-copy">
          License fields may be left unknown. OpenBioFigure will flag the asset
          as not publication-ready; it never guesses a license.
        </p>
        {pending.changed && (
          <p className="notice warning">
            Potentially active SVG content was removed before import.
          </p>
        )}
        {validationError && (
          <p className="notice warning" role="alert">
            {validationError}
          </p>
        )}
        <div className="dialog-fields two-columns">
          <FormField label="Asset title">
            <input
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              aria-invalid={!title.trim()}
            />
          </FormField>
          <FormField label="Creator">
            <input
              value={creator}
              onChange={(e) => setCreator(e.currentTarget.value)}
              placeholder="Unknown if not supplied"
            />
          </FormField>
          <FormField label="Original source URL">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.currentTarget.value)}
              placeholder="https://…"
            />
          </FormField>
          <FormField label="License identifier">
            <input
              value={licenseId}
              onChange={(e) => setLicenseId(e.currentTarget.value)}
              placeholder="e.g. CC-BY-4.0"
            />
          </FormField>
          <FormField label="License name">
            <input
              value={licenseName}
              onChange={(e) => setLicenseName(e.currentTarget.value)}
            />
          </FormField>
          <FormField label="License URL">
            <input
              type="url"
              value={licenseUrl}
              onChange={(e) => setLicenseUrl(e.currentTarget.value)}
              placeholder="https://…"
            />
          </FormField>
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            checked={attributionRequired}
            onChange={(e) => setAttributionRequired(e.currentTarget.checked)}
          />{" "}
          Attribution is required
        </label>
        <FormField label="Attribution text">
          <textarea
            className="resize-none"
            rows={3}
            value={attribution}
            onChange={(e) => setAttribution(e.currentTarget.value)}
            placeholder="Exact credit text, if known"
          />
        </FormField>
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            Import SVG
          </button>
        </div>
      </form>
    </div>
  );
}

function AssetsPanel({
  locale,
  filters,
  setFilters,
  onAdd,
  onFile,
}: {
  locale: Locale;
  filters: AssetFilters;
  setFilters: (filters: AssetFilters) => void;
  onAdd: (asset: AssetMetadata) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const results = useMemo(() => searchAssets(seedCatalog, filters), [filters]);
  const categories = [...new Set(seedCatalog.map((asset) => asset.category))];
  const providers = [
    ...new Set(seedCatalog.map((asset) => asset.source.provider)),
  ];
  const licenses = [...new Set(seedCatalog.map((asset) => asset.license.id))];
  return (
    <aside className="left-panel" aria-label="Scientific asset library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Verified catalog</p>
          <h2>{t(locale, "assets")}</h2>
        </div>
        <span className="count-badge">{seedCatalog.length}</span>
      </div>
      <div className="search-control">
        <Search aria-hidden="true" />
        <input
          aria-label={t(locale, "searchAssets")}
          placeholder={t(locale, "searchAssets")}
          value={filters.query}
          onChange={(e) =>
            setFilters({ ...filters, query: e.currentTarget.value })
          }
        />
        {filters.query && (
          <IconButton
            label={t(locale, "clearSearch")}
            onClick={() => setFilters({ ...filters, query: "" })}
          >
            <X />
          </IconButton>
        )}
      </div>
      <details className="filters">
        <summary>
          <span>Filters</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="filter-grid">
          <FormField label={t(locale, "category")}>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "source")}>
            <select
              value={filters.provider}
              onChange={(e) =>
                setFilters({ ...filters, provider: e.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {providers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "license")}>
            <select
              value={filters.license}
              onChange={(e) =>
                setFilters({ ...filters, license: e.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {licenses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "attribution")}>
            <select
              value={filters.attribution}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  attribution: e.currentTarget
                    .value as AssetFilters["attribution"],
                })
              }
            >
              <option value="all">{t(locale, "all")}</option>
              <option value="required">{t(locale, "required")}</option>
              <option value="not-required">{t(locale, "notRequired")}</option>
            </select>
          </FormField>
        </div>
      </details>
      <div className="asset-results" aria-live="polite">
        {results.map((asset) => (
          <article
            className="asset-card"
            key={asset.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(
                "application/x-openbiofigure-asset",
                asset.id,
              );
            }}
          >
            <div
              className="asset-thumb"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: sanitizeSvg(assetToSvg(asset)).svg,
              }}
            />
            <div className="asset-card-copy">
              <strong>{asset.title}</strong>
              <span>{asset.category}</span>
              <small>
                {asset.license.id}
                {asset.license.attributionRequired ? " · credit" : ""}
              </small>
            </div>
            <button
              type="button"
              className="asset-add"
              onClick={() => onAdd(asset)}
              aria-label={`${t(locale, "addToCanvas")}: ${asset.title}`}
              title={t(locale, "addToCanvas")}
            >
              <FilePlus2 />
            </button>
          </article>
        ))}
        {!results.length && (
          <div className="empty-state">
            <Search />
            <p>{t(locale, "noResults")}</p>
            <button
              type="button"
              className="text-button"
              onClick={() => setFilters(defaultFilters)}
            >
              {t(locale, "clearFilters")}
            </button>
          </div>
        )}
      </div>
      <label className="import-button">
        <Upload aria-hidden="true" /> Import local SVG
        <input
          className="visually-hidden"
          type="file"
          accept="image/svg+xml,.svg"
          onChange={onFile}
        />
      </label>
    </aside>
  );
}

function assetToSvg(asset: AssetMetadata) {
  return getSeedSvg(asset);
}

function PropertyInspector({
  selection,
  onUpdate,
  onAlign,
  onDistribute,
}: {
  selection: SelectionSnapshot | null;
  onUpdate: (value: Partial<SelectionSnapshot>) => void;
  onAlign: (mode: Parameters<FabricEditor["align"]>[0]) => void;
  onDistribute: (axis: Parameters<FabricEditor["distribute"]>[0]) => void;
}) {
  if (!selection)
    return (
      <div className="empty-state compact">
        <MousePointer2 />
        <p>Select an object to edit its properties.</p>
      </div>
    );
  const numeric =
    (field: keyof SelectionSnapshot) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      onUpdate({ [field]: event.currentTarget.valueAsNumber });
  return (
    <div className="inspector-content">
      <section className="inspector-section">
        <div className="section-title">
          <h3>Selection</h3>
          <span>{selection.kind}</span>
        </div>
        <FormField label="Layer name">
          <input
            value={selection.name}
            onChange={(e) => onUpdate({ name: e.currentTarget.value })}
          />
        </FormField>
      </section>
      <section className="inspector-section">
        <div className="section-title">
          <h3>Position</h3>
          <span>
            {selection.count > 1 ? `${selection.count} objects` : "px"}
          </span>
        </div>
        <div className="input-grid">
          <FormField label="X">
            <input type="number" value={selection.x} onChange={numeric("x")} />
          </FormField>
          <FormField label="Y">
            <input type="number" value={selection.y} onChange={numeric("y")} />
          </FormField>
          <FormField label="W">
            <input type="number" value={selection.width} disabled />
          </FormField>
          <FormField label="H">
            <input type="number" value={selection.height} disabled />
          </FormField>
          <FormField label="Rotation">
            <input
              type="number"
              value={selection.angle}
              onChange={numeric("angle")}
            />
          </FormField>
        </div>
      </section>
      <section className="inspector-section">
        <div className="section-title">
          <h3>Style</h3>
        </div>
        <div className="color-grid">
          <FormField label="Fill">
            <input
              type="color"
              value={selection.fill ?? "#ffffff"}
              onChange={(e) => onUpdate({ fill: e.currentTarget.value })}
            />
          </FormField>
          <FormField label="Stroke">
            <input
              type="color"
              value={selection.stroke ?? "#263238"}
              onChange={(e) => onUpdate({ stroke: e.currentTarget.value })}
            />
          </FormField>
        </div>
        <FormField label={`Opacity · ${Math.round(selection.opacity * 100)}%`}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selection.opacity}
            onChange={numeric("opacity")}
          />
        </FormField>
        <FormField label="Stroke width">
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={selection.strokeWidth}
            onChange={numeric("strokeWidth")}
          />
        </FormField>
        {selection.kind === "text" && (
          <>
            <FormField label="Font">
              <select
                value={selection.fontFamily}
                onChange={(e) =>
                  onUpdate({ fontFamily: e.currentTarget.value })
                }
              >
                <option value="Inter, Arial, sans-serif">Inter / Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
              </select>
            </FormField>
            <FormField label="Font size">
              <input
                type="number"
                min="6"
                max="240"
                value={selection.fontSize}
                onChange={numeric("fontSize")}
              />
            </FormField>
            <FormField label="Text alignment">
              <select
                value={selection.textAlign}
                onChange={(e) =>
                  onUpdate({
                    textAlign: e.currentTarget
                      .value as SelectionSnapshot["textAlign"],
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </FormField>
          </>
        )}
      </section>
      <section className="inspector-section">
        <div className="section-title">
          <h3>Align & distribute</h3>
        </div>
        <div className="icon-grid six">
          <IconButton
            label="Align left"
            onClick={() => onAlign("left")}
            disabled={selection.count < 2}
          >
            <AlignStartVertical />
          </IconButton>
          <IconButton
            label="Align horizontal center"
            onClick={() => onAlign("center")}
            disabled={selection.count < 2}
          >
            <AlignCenterVertical />
          </IconButton>
          <IconButton
            label="Align right"
            onClick={() => onAlign("right")}
            disabled={selection.count < 2}
          >
            <AlignEndVertical />
          </IconButton>
          <IconButton
            label="Align top"
            onClick={() => onAlign("top")}
            disabled={selection.count < 2}
          >
            <AlignStartHorizontal />
          </IconButton>
          <IconButton
            label="Align vertical center"
            onClick={() => onAlign("middle")}
            disabled={selection.count < 2}
          >
            <AlignCenterHorizontal />
          </IconButton>
          <IconButton
            label="Align bottom"
            onClick={() => onAlign("bottom")}
            disabled={selection.count < 2}
          >
            <AlignEndHorizontal />
          </IconButton>
          <IconButton
            label="Distribute horizontally"
            onClick={() => onDistribute("horizontal")}
            disabled={selection.count < 3}
          >
            <ArrowLeftRight />
          </IconButton>
          <IconButton
            label="Distribute vertically"
            onClick={() => onDistribute("vertical")}
            disabled={selection.count < 3}
          >
            <GripVertical />
          </IconButton>
        </div>
      </section>
    </div>
  );
}

function LayersPanel({
  layers,
  onSelect,
  onToggle,
  onMove,
}: {
  layers: LayerSnapshot[];
  onSelect: (id: string) => void;
  onToggle: (id: string, field: "visible" | "locked") => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  if (!layers.length)
    return (
      <div className="empty-state compact">
        <Layers3 />
        <p>Add an object to create the first layer.</p>
      </div>
    );
  return (
    <div className="layer-list">
      {layers.map((layer, index) => (
        <div
          className={`layer-row${layer.selected ? " is-selected" : ""}`}
          key={layer.id}
        >
          <button
            type="button"
            className="layer-main"
            onClick={() => onSelect(layer.id)}
          >
            <span className={`kind-dot kind-${layer.kind}`} />
            <span>
              <strong>{layer.name}</strong>
              <small>{layer.kind}</small>
            </span>
          </button>
          <IconButton
            label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
            onClick={() => onToggle(layer.id, "visible")}
          >
            {layer.visible ? <Eye /> : <EyeOff />}
          </IconButton>
          <IconButton
            label={`${layer.locked ? "Unlock" : "Lock"} ${layer.name}`}
            onClick={() => onToggle(layer.id, "locked")}
          >
            {layer.locked ? <Lock /> : <Unlock />}
          </IconButton>
          <span className="layer-move">
            <IconButton
              label={`Move ${layer.name} up`}
              onClick={() => onMove(layer.id, "up")}
              disabled={index === 0}
            >
              <ArrowUp />
            </IconButton>
            <IconButton
              label={`Move ${layer.name} down`}
              onClick={() => onMove(layer.id, "down")}
              disabled={index === layers.length - 1}
            >
              <ArrowDown />
            </IconButton>
          </span>
        </div>
      ))}
    </div>
  );
}

function LicensingPanel({
  project,
  onDownload,
}: {
  project: OpenBioFigureProject;
  onDownload: (format: "markdown" | "text") => void;
}) {
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

export function App() {
  const [project, setProject] = useState(() => createProject("journal"));
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);
  const [layers, setLayers] = useState<LayerSnapshot[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [tab, setTab] = useState<InspectorTab>("properties");
  const [zoom, setZoom] = useState(0.72);
  const [panning, setPanning] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [pendingSvg, setPendingSvg] = useState<PendingSvg | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [exportScale, setExportScale] = useState(2);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<FabricEditor | null>(null);
  const historyRef = useRef(new ProjectHistory(project));
  const initialProjectRef = useRef(project);
  const applyingHistory = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  const openProjectRef = useRef<HTMLInputElement>(null);
  const panStart = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const handleSnapshot = useCallback(
    (snapshot: {
      project: OpenBioFigureProject;
      selection: SelectionSnapshot | null;
      layers: LayerSnapshot[];
    }) => {
      setProject(snapshot.project);
      setSelection(snapshot.selection);
      setLayers(snapshot.layers);
      if (!applyingHistory.current) historyRef.current.push(snapshot.project);
      setSaveState("saving");
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => {
        void storage
          .save(snapshot.project)
          .then(() => setSaveState("saved"))
          .catch(() => setSaveState("error"));
      }, 450);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    void storage
      .load()
      .then((saved) => {
        if (!active) return;
        const restored = saved ?? initialProjectRef.current;
        initialProjectRef.current = restored;
        setProject(restored);
        historyRef.current = new ProjectHistory(restored);
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setSaveState("error");
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !canvasRef.current || editorRef.current) return;
    const editor = new FabricEditor(
      canvasRef.current,
      initialProjectRef.current,
      handleSnapshot,
    );
    editorRef.current = editor;
    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, [ready, handleSnapshot]);

  const replaceProject = useCallback(
    async (next: OpenBioFigureProject, resetHistory = true) => {
      if (!editorRef.current) return;
      applyingHistory.current = true;
      await editorRef.current.load(next);
      setProject(next);
      setSelection(null);
      setLayers(editorRef.current.getLayers());
      if (resetHistory) historyRef.current = new ProjectHistory(next);
      else historyRef.current.replace(next);
      applyingHistory.current = false;
      await storage.save(next);
      setSaveState("saved");
    },
    [],
  );

  const undo = useCallback(async () => {
    const previous = historyRef.current.undo();
    if (previous) {
      await replaceProject(previous, false);
      showNotice("Undo");
    }
  }, [replaceProject, showNotice]);
  const redo = useCallback(async () => {
    const next = historyRef.current.redo();
    if (next) {
      await replaceProject(next, false);
      showNotice("Redo");
    }
  }, [replaceProject, showNotice]);

  const fitToScreen = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const next = Math.min(
      (workspace.clientWidth - 80) / project.document.width,
      (workspace.clientHeight - 80) / project.document.height,
      1.5,
    );
    setZoom(Math.max(0.1, next));
    window.requestAnimationFrame(() => {
      workspace.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    });
  }, [project.document.height, project.document.width]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || target.isContentEditable)
        return;
      const editor = editorRef.current;
      if (!editor) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        void (event.shiftKey ? redo() : undo());
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        void redo();
      } else if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        editor.copy();
        showNotice("Copied");
      } else if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        void editor.paste();
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        void editor.duplicate();
      } else if (mod && event.key.toLowerCase() === "g") {
        event.preventDefault();
        if (event.shiftKey) editor.ungroup();
        else editor.group();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        editor.deleteSelection();
      } else if (event.key === "0") {
        fitToScreen();
      } else if (event.code === "Space") setPanning(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setPanning(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [redo, undo, showNotice, fitToScreen]);

  useEffect(() => {
    if (!ready || !editorRef.current) return;
    const frame = window.requestAnimationFrame(fitToScreen);
    return () => window.cancelAnimationFrame(frame);
  }, [ready, fitToScreen]);

  const addAsset = useCallback(
    async (asset: AssetMetadata, point?: { x: number; y: number }) => {
      const svg = sanitizeSvg(await seedProvider.loadSvg(asset)).svg;
      const { file, integrity, ...metadata } = asset;
      void file;
      void integrity;
      await editorRef.current?.addAsset(
        { ...metadata, svg, verified: true },
        point,
      );
      setTab("licensing");
    },
    [],
  );

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-openbiofigure-asset");
    const asset = seedCatalog.find((item) => item.id === id);
    if (!asset) return;
    const canvas = document
      .querySelector(".canvas-container")
      ?.getBoundingClientRect();
    if (!canvas) return;
    void addAsset(asset, {
      x: (event.clientX - canvas.left) / zoom,
      y: (event.clientY - canvas.top) / zoom,
    });
  };

  const handleSvgFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const result = sanitizeSvg(await file.text());
      setPendingSvg({
        fileName: file.name,
        svg: result.svg,
        changed: result.changed,
      });
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "SVG import failed");
    }
  };

  const exportProject = () =>
    makeDownload(
      buildProjectJson(project),
      "application/json",
      `${safeFileStem(project.metadata.title)}.obf.json`,
    );
  const exportSvg = () => {
    const editor = editorRef.current;
    if (!editor) return;
    makeDownload(
      buildSvgExport(editor.getSvg(), project),
      "image/svg+xml",
      `${safeFileStem(project.metadata.title)}.svg`,
    );
    showNotice("SVG exported");
  };
  const exportPng = () => {
    const dataUrl = editorRef.current?.getPng(exportScale);
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${safeFileStem(project.metadata.title)}@${exportScale}x.png`;
    anchor.click();
    showNotice(`PNG exported at ${exportScale}×`);
  };
  const exportAttributions = (format: "markdown" | "text") => {
    const output = generateAttributions(project);
    makeDownload(
      format === "markdown" ? output.markdown : output.text,
      format === "markdown" ? "text/markdown" : "text/plain",
      format === "markdown" ? "ATTRIBUTIONS.md" : "Attribution.txt",
    );
  };

  const openProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const next = migrateProject(JSON.parse(await file.text()) as unknown);
      await replaceProject(next);
      showNotice("Project opened");
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Project could not be opened",
      );
    }
  };

  const onPanStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panning || !workspaceRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      left: workspaceRef.current.scrollLeft,
      top: workspaceRef.current.scrollTop,
    };
  };
  const onPanMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStart.current || !workspaceRef.current) return;
    workspaceRef.current.scrollLeft =
      panStart.current.left - (event.clientX - panStart.current.x);
    workspaceRef.current.scrollTop =
      panStart.current.top - (event.clientY - panStart.current.y);
  };

  const publication = checkPublication(project);
  const locale: Locale = project.settings.locale;
  const localized = messages[locale];
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-label="OpenBioFigure home">
          <span className="brand-glyph">
            <Circle />
            <Minus />
          </span>
          <strong>OpenBioFigure</strong>
          <span className="version">v0.1</span>
        </div>
        <div className="toolbar-group document-actions">
          <IconButton label="New document" onClick={() => setNewDialog(true)}>
            <FilePlus2 />
          </IconButton>
          <IconButton
            label="Open project"
            onClick={() => openProjectRef.current?.click()}
          >
            <FolderOpen />
          </IconButton>
          <IconButton
            label="Save project file"
            onClick={exportProject}
            testId="save-project"
          >
            <Download />
          </IconButton>
          <input
            ref={openProjectRef}
            className="visually-hidden"
            type="file"
            accept=".json,.obf.json,application/json"
            onChange={(event) => void openProject(event)}
          />
        </div>
        <div className="toolbar-separator" />
        <div className="toolbar-group">
          <IconButton
            label="Undo"
            onClick={() => void undo()}
            disabled={!historyRef.current.canUndo}
            testId="undo"
          >
            <Undo2 />
          </IconButton>
          <IconButton
            label="Redo"
            onClick={() => void redo()}
            disabled={!historyRef.current.canRedo}
            testId="redo"
          >
            <Redo2 />
          </IconButton>
          <IconButton
            label="Duplicate selection"
            onClick={() => void editorRef.current?.duplicate()}
            disabled={!selection}
          >
            <Copy />
          </IconButton>
          <IconButton
            label="Delete selection"
            onClick={() => editorRef.current?.deleteSelection()}
            disabled={!selection}
          >
            <Trash2 />
          </IconButton>
        </div>
        <div className="toolbar-separator" />
        <div className="toolbar-group object-tools" aria-label="Insert objects">
          <IconButton
            label="Select tool"
            active={!panning}
            onClick={() => setPanning(false)}
          >
            <MousePointer2 />
          </IconButton>
          <IconButton
            label="Pan tool"
            active={panning}
            onClick={() => setPanning((value) => !value)}
          >
            <Hand />
          </IconButton>
          <IconButton
            label="Add text"
            onClick={() => editorRef.current?.addText()}
            testId="add-text"
          >
            <TextCursorInput />
          </IconButton>
          <IconButton
            label="Add rectangle"
            onClick={() => editorRef.current?.addRect()}
            testId="add-rectangle"
          >
            <Square />
          </IconButton>
          <IconButton
            label="Add ellipse"
            onClick={() => editorRef.current?.addEllipse()}
          >
            <Circle />
          </IconButton>
          <IconButton
            label="Add line"
            onClick={() => editorRef.current?.addLine()}
          >
            <Minus />
          </IconButton>
          <IconButton
            label="Add arrow"
            onClick={() => editorRef.current?.addArrow()}
          >
            <ArrowRight />
          </IconButton>
          <IconButton
            label="Add connector"
            onClick={() => editorRef.current?.addLine("connector")}
          >
            <BoxSelect />
          </IconButton>
        </div>
        <div className="toolbar-separator" />
        <div className="toolbar-group arrange-tools">
          <IconButton
            label="Group selection"
            onClick={() => editorRef.current?.group()}
            disabled={!selection || selection.count < 2}
          >
            <Group />
          </IconButton>
          <IconButton
            label="Ungroup selection"
            onClick={() => editorRef.current?.ungroup()}
            disabled={selection?.kind !== "group"}
          >
            <Ungroup />
          </IconButton>
          <IconButton
            label="Bring to front"
            onClick={() => editorRef.current?.arrange("front")}
            disabled={!selection}
          >
            <ArrowUpToLine />
          </IconButton>
          <IconButton
            label="Bring forward"
            onClick={() => editorRef.current?.arrange("forward")}
            disabled={!selection}
          >
            <ArrowUp />
          </IconButton>
          <IconButton
            label="Send backward"
            onClick={() => editorRef.current?.arrange("backward")}
            disabled={!selection}
          >
            <ArrowDown />
          </IconButton>
          <IconButton
            label="Send to back"
            onClick={() => editorRef.current?.arrange("back")}
            disabled={!selection}
          >
            <ArrowDownToLine />
          </IconButton>
        </div>
        <div className="title-field">
          <input
            aria-label="Figure title"
            value={project.metadata.title}
            onChange={(event) => {
              const next = structuredClone(project);
              next.metadata.title =
                event.currentTarget.value || "Untitled figure";
              next.metadata.updatedAt = new Date().toISOString();
              void replaceProject(next, false);
            }}
          />
        </div>
        <div className="toolbar-group export-actions">
          <button
            type="button"
            className="button export-button"
            onClick={exportSvg}
            data-testid="export-svg"
          >
            <Download /> SVG
          </button>
          <label className="export-scale">
            <span className="visually-hidden">PNG export scale</span>
            <select
              aria-label="PNG export scale"
              value={exportScale}
              onChange={(event) =>
                setExportScale(Number(event.currentTarget.value))
              }
            >
              {[1, 2, 3, 4].map((scale) => (
                <option value={scale} key={scale}>
                  {scale}×
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button export-button"
            onClick={exportPng}
            data-testid="export-png"
          >
            <ImageDown /> PNG {exportScale}×
          </button>
        </div>
      </header>

      <div className="editor-grid">
        <AssetsPanel
          locale={locale}
          filters={filters}
          setFilters={setFilters}
          onAdd={(asset) => void addAsset(asset)}
          onFile={(event) => void handleSvgFile(event)}
        />
        <main className="workspace-column">
          <div className="workspace-ribbon">
            <span>
              {project.document.width} × {project.document.height} px
            </span>
            <span>{project.document.preset}</span>
            <label className="background-control">
              <span>Background</span>
              <input
                aria-label="Document background"
                type="color"
                value={project.document.background}
                onChange={(event) =>
                  editorRef.current?.setBackground(event.currentTarget.value)
                }
              />
            </label>
            <div className="zoom-controls">
              <IconButton
                label="Zoom out"
                onClick={() => setZoom((value) => Math.max(0.1, value - 0.1))}
              >
                <ZoomOut />
              </IconButton>
              <button
                type="button"
                className="zoom-value"
                onClick={fitToScreen}
                title="Fit to screen"
              >
                {Math.round(zoom * 100)}%
              </button>
              <IconButton
                label="Zoom in"
                onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
              >
                <ZoomIn />
              </IconButton>
            </div>
          </div>
          <div
            className={`workspace${panning ? " is-panning" : ""}`}
            ref={workspaceRef}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDrop}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={() => {
              panStart.current = null;
            }}
            data-testid="workspace"
          >
            <div
              className="canvas-scale-shell"
              style={{
                width: project.document.width * zoom,
                height: project.document.height * zoom,
              }}
            >
              <div
                className="canvas-transform"
                style={{
                  transform: `scale(${zoom})`,
                  width: project.document.width,
                  height: project.document.height,
                }}
              >
                <canvas
                  ref={canvasRef}
                  aria-label="OpenBioFigure editable canvas"
                />
              </div>
            </div>
          </div>
        </main>
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
              onClick={() => setTab("properties")}
            >
              <Shapes />
              {localized.style}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "layers"}
              onClick={() => setTab("layers")}
            >
              <Layers3 />
              {localized.layers}
              <span>{layers.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "licensing"}
              onClick={() => setTab("licensing")}
            >
              <Check />
              License{publication.incompleteCount > 0 && <i>!</i>}
            </button>
          </div>
          {tab === "properties" && (
            <PropertyInspector
              selection={selection}
              onUpdate={(value) => editorRef.current?.updateSelection(value)}
              onAlign={(mode) => editorRef.current?.align(mode)}
              onDistribute={(axis) => editorRef.current?.distribute(axis)}
            />
          )}
          {tab === "layers" && (
            <LayersPanel
              layers={layers}
              onSelect={(id) => editorRef.current?.select(id)}
              onToggle={(id, field) =>
                editorRef.current?.toggleLayer(id, field)
              }
              onMove={(id, direction) =>
                editorRef.current?.moveLayer(id, direction)
              }
            />
          )}
          {tab === "licensing" && (
            <LicensingPanel project={project} onDownload={exportAttributions} />
          )}
        </aside>
      </div>

      <footer className="statusbar">
        <span className={`save-status status-${saveState}`}>
          {saveState === "saving"
            ? localized.saving
            : saveState === "error"
              ? localized.saveFailed
              : localized.savedLocally}
        </span>
        <span className="status-center">
          {selection
            ? `${selection.count} selected · ${selection.name}`
            : "Ready · No selection"}
        </span>
        <button
          type="button"
          onClick={() => setTab("licensing")}
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
      {newDialog && (
        <NewDocumentDialog
          onClose={() => setNewDialog(false)}
          onCreate={(preset, width, height) => {
            const next = createProject(preset, { width, height });
            void replaceProject(next).then(() => {
              setNewDialog(false);
              fitToScreen();
            });
          }}
        />
      )}
      {pendingSvg && (
        <SvgMetadataDialog
          pending={pendingSvg}
          onClose={() => setPendingSvg(null)}
          onImport={(asset) => {
            void editorRef.current?.addAsset(asset);
            setPendingSvg(null);
            setTab("licensing");
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
