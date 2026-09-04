import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { EditorStatus } from "./app/EditorStatus";
import { EditorToolbar } from "./app/EditorToolbar";
import { InspectorSidebar } from "./app/InspectorSidebar";
import { WorkspaceCanvas } from "./app/WorkspaceCanvas";
import type { InspectorTab, PendingSvg, SaveState } from "./app/types";
import { seedCatalog, seedProvider } from "./assets/catalog";
import { NewDocumentDialog } from "./components/dialogs/NewDocumentDialog";
import { SvgMetadataDialog } from "./components/dialogs/SvgMetadataDialog";
import { sanitizeSvg } from "./domain/assets/sanitize";
import type { AssetMetadata } from "./domain/assets/schema";
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
import { createProject } from "./domain/project/factory";
import { ProjectHistory } from "./domain/project/history";
import { migrateProject } from "./domain/project/migrations";
import type { OpenBioFigureProject } from "./domain/project/schema";
import { IndexedDbProjectStorage } from "./domain/storage/projectStorage";
import {
  FabricEditor,
  type LayerSnapshot,
  type SelectionSnapshot,
} from "./editor/FabricEditor";
import { AssetsPanel } from "./features/assets/AssetsPanel";
import { DEFAULT_ASSET_FILTERS } from "./features/assets/filters";
import { messages, type Locale } from "./i18n/messages";
import {
  dataUrlToBytes,
  isDesktopRuntime,
  openDesktopTextFile,
  saveDesktopBinaryFile,
  saveDesktopTextFile,
} from "./platform/desktopFiles";

const storage = new IndexedDbProjectStorage();

export function App() {
  const [project, setProject] = useState(() => createProject("journal"));
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);
  const [layers, setLayers] = useState<LayerSnapshot[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ASSET_FILTERS);
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

  const exportProject = async () => {
    const filename = `${safeFileStem(project.metadata.title)}.obf.json`;
    const contents = buildProjectJson(project);
    if (
      !(await saveDesktopTextFile(contents, filename, [
        { name: "OpenBioFigure project", extensions: ["obf.json", "json"] },
      ]))
    ) {
      makeDownload(contents, "application/json", filename);
    }
  };
  const exportSvg = async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const filename = `${safeFileStem(project.metadata.title)}.svg`;
    const contents = buildSvgExport(editor.getSvg(), project);
    if (
      !(await saveDesktopTextFile(contents, filename, [
        { name: "Scalable Vector Graphics", extensions: ["svg"] },
      ]))
    ) {
      makeDownload(contents, "image/svg+xml", filename);
    }
    showNotice("SVG exported");
  };
  const exportPng = async () => {
    const dataUrl = editorRef.current?.getPng(exportScale);
    if (!dataUrl) return;
    const filename = `${safeFileStem(project.metadata.title)}@${exportScale}x.png`;
    if (
      !(await saveDesktopBinaryFile(await dataUrlToBytes(dataUrl), filename, [
        { name: "Portable Network Graphics", extensions: ["png"] },
      ]))
    ) {
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = filename;
      anchor.click();
    }
    showNotice(`PNG exported at ${exportScale}×`);
  };
  const exportAttributions = async (format: "markdown" | "text") => {
    const output = generateAttributions(project);
    const markdown = format === "markdown";
    const contents = markdown ? output.markdown : output.text;
    const filename = markdown ? "ATTRIBUTIONS.md" : "Attribution.txt";
    if (
      !(await saveDesktopTextFile(contents, filename, [
        {
          name: markdown ? "Markdown" : "Plain text",
          extensions: [markdown ? "md" : "txt"],
        },
      ]))
    ) {
      makeDownload(
        contents,
        markdown ? "text/markdown" : "text/plain",
        filename,
      );
    }
  };

  const openDesktopProject = async () => {
    const file = await openDesktopTextFile([
      { name: "OpenBioFigure project", extensions: ["obf.json", "json"] },
    ]);
    if (!file) return;
    try {
      await replaceProject(
        migrateProject(JSON.parse(file.contents) as unknown),
      );
      showNotice("Project opened");
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Project could not be opened",
      );
    }
  };

  const importDesktopSvg = async () => {
    const file = await openDesktopTextFile([
      { name: "Scalable Vector Graphics", extensions: ["svg"] },
    ]);
    if (!file) return;
    try {
      const result = sanitizeSvg(file.contents);
      setPendingSvg({
        fileName: file.fileName,
        svg: result.svg,
        changed: result.changed,
      });
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "SVG import failed");
    }
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
      <EditorToolbar
        getEditor={() => editorRef.current}
        selection={selection}
        canUndo={historyRef.current.canUndo}
        canRedo={historyRef.current.canRedo}
        panning={panning}
        title={project.metadata.title}
        exportScale={exportScale}
        openProjectRef={openProjectRef}
        onNew={() => setNewDialog(true)}
        onRequestOpenProject={() => {
          if (isDesktopRuntime()) void openDesktopProject();
          else openProjectRef.current?.click();
        }}
        onOpenProject={(event) => void openProject(event)}
        onSaveProject={() => void exportProject()}
        onUndo={() => void undo()}
        onRedo={() => void redo()}
        onPanningChange={setPanning}
        onTitleChange={(title) => {
          const next = structuredClone(project);
          next.metadata.title = title || "Untitled figure";
          next.metadata.updatedAt = new Date().toISOString();
          void replaceProject(next, false);
        }}
        onExportScaleChange={setExportScale}
        onExportSvg={() => void exportSvg()}
        onExportPng={() => void exportPng()}
      />

      <div className="editor-grid">
        <AssetsPanel
          locale={locale}
          filters={filters}
          setFilters={setFilters}
          onAdd={(asset) => void addAsset(asset)}
          onFile={(event) => void handleSvgFile(event)}
          onRequestFile={
            isDesktopRuntime() ? () => void importDesktopSvg() : undefined
          }
        />
        <WorkspaceCanvas
          project={project}
          zoom={zoom}
          panning={panning}
          canvasRef={canvasRef}
          workspaceRef={workspaceRef}
          onDrop={handleDrop}
          onPanStart={onPanStart}
          onPanMove={onPanMove}
          onPanEnd={() => {
            panStart.current = null;
          }}
          onBackgroundChange={(color) =>
            editorRef.current?.setBackground(color)
          }
          onZoomChange={setZoom}
          onFitToScreen={fitToScreen}
        />
        <InspectorSidebar
          tab={tab}
          project={project}
          selection={selection}
          layers={layers}
          publication={publication}
          styleLabel={localized.style}
          layersLabel={localized.layers}
          getEditor={() => editorRef.current}
          onTabChange={setTab}
          onExportAttributions={(format) => void exportAttributions(format)}
        />
      </div>

      <EditorStatus
        saveState={saveState}
        selection={selection}
        publication={publication}
        labels={localized}
        onOpenLicensing={() => setTab("licensing")}
      />
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
