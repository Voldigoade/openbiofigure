import {
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { EditorStatus } from "./app/EditorStatus";
import { EditorToolbar } from "./app/EditorToolbar";
import { InspectorSidebar } from "./app/InspectorSidebar";
import { ApplicationMenuBar } from "./app/ApplicationMenuBar";
import { SettingsScreen } from "./app/SettingsScreen";
import { StartScreen } from "./app/StartScreen";
import { WorkspaceCanvas } from "./app/WorkspaceCanvas";
import type { InspectorTab, PendingSvg, SaveState } from "./app/types";
import { seedProvider } from "./assets/provider";
import { NewDocumentDialog } from "./components/dialogs/NewDocumentDialog";
import { ChartDialog } from "./components/dialogs/ChartDialog";
import { KeyboardShortcutsDialog } from "./components/dialogs/KeyboardShortcutsDialog";
import { SvgMetadataDialog } from "./components/dialogs/SvgMetadataDialog";
import { sanitizeSvg } from "./domain/assets/sanitize";
import type { AssetMetadata } from "./domain/assets/schema";
import { createChartObject } from "./domain/charts/chart";
import {
  assetLibraryChangeEvent,
  loadAssetLibraryState,
  recordRecentAsset,
  saveAssetLibraryState,
} from "./domain/assets/libraryState";
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
import {
  applyAppearancePreferences,
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "./domain/preferences/preferences";
import { createTemplateProject } from "./domain/templates/templates";
import { buildPublicationReport } from "./domain/publication/preflight";
import {
  IndexedDbProjectStorage,
  type RecentProject,
} from "./domain/storage/projectStorage";
import {
  FabricEditor,
  type LayerSnapshot,
  type SelectionSnapshot,
} from "./editor/FabricEditor";
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
const ACTIVE_SESSION_KEY = "openbiofigure:active-editor";
const AssetsPanel = lazy(async () => ({
  default: (await import("./features/assets/AssetsPanel")).AssetsPanel,
}));

type AppView = "home" | "editor" | "settings";

function rememberAssetUse(assetId: string) {
  try {
    const state = loadAssetLibraryState(window.localStorage);
    saveAssetLibraryState(
      window.localStorage,
      recordRecentAsset(state, assetId),
    );
    window.dispatchEvent(new Event(assetLibraryChangeEvent));
  } catch {
    // Asset placement must not depend on local-storage availability.
  }
}

export function App() {
  const [project, setProject] = useState(() => createProject("journal"));
  const [view, setView] = useState<AppView>("home");
  const [settingsReturnView, setSettingsReturnView] = useState<
    "home" | "editor"
  >("home");
  const [autosaveProject, setAutosaveProject] =
    useState<OpenBioFigureProject | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [preferences, setPreferences] = useState(() =>
    loadPreferences(window.localStorage),
  );
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);
  const [layers, setLayers] = useState<LayerSnapshot[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ASSET_FILTERS);
  const [tab, setTab] = useState<InspectorTab>("properties");
  const [zoom, setZoom] = useState(0.72);
  const [panning, setPanning] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [pendingSvg, setPendingSvg] = useState<PendingSvg | null>(null);
  const [shortcutsDialog, setShortcutsDialog] = useState(false);
  const [chartDialog, setChartDialog] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [exportScale, setExportScale] = useState(preferences.pngExportScale);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<FabricEditor | null>(null);
  const historyRef = useRef(new ProjectHistory(project));
  const initialProjectRef = useRef(project);
  const initialPreferencesRef = useRef(preferences);
  const applyingHistory = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  const openProjectRef = useRef<HTMLInputElement>(null);
  const panStart = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  const refreshRecent = useCallback(async () => {
    setRecentProjects(await storage.listRecent());
  }, []);

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
          .then(async () => {
            setAutosaveProject(snapshot.project);
            await refreshRecent();
            setSaveState("saved");
          })
          .catch(() => setSaveState("error"));
      }, 450);
    },
    [refreshRecent],
  );

  useEffect(() => {
    let active = true;
    void storage
      .load()
      .then(async (saved) => {
        if (!active) return;
        const restored = saved ?? initialProjectRef.current;
        initialProjectRef.current = restored;
        setProject(restored);
        setAutosaveProject(saved);
        setRecentProjects(await storage.listRecent());
        historyRef.current = new ProjectHistory(restored);
        if (
          saved &&
          (window.sessionStorage.getItem(ACTIVE_SESSION_KEY) ||
            initialPreferencesRef.current.startup === "reopen")
        ) {
          setView("editor");
        }
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
    if (!ready || view !== "editor" || !canvasRef.current || editorRef.current)
      return;
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
  }, [ready, view, handleSnapshot]);

  useEffect(() => {
    savePreferences(window.localStorage, preferences);
    applyAppearancePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    setExportScale(preferences.pngExportScale);
  }, [preferences.pngExportScale]);

  useEffect(() => {
    const protectUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (saveState !== "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () =>
      window.removeEventListener("beforeunload", protectUnsavedChanges);
  }, [saveState]);

  const activateProject = useCallback(
    async (next: OpenBioFigureProject) => {
      initialProjectRef.current = next;
      setProject(next);
      setSelection(null);
      setLayers([]);
      historyRef.current = new ProjectHistory(next);
      window.sessionStorage.setItem(ACTIVE_SESSION_KEY, "true");
      setView("editor");
      setSaveState("saving");
      try {
        await storage.save(next);
        setAutosaveProject(next);
        await refreshRecent();
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [refreshRecent],
  );

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
      setAutosaveProject(next);
      await refreshRecent();
      setSaveState("saved");
    },
    [refreshRecent],
  );

  const openOrReplaceProject = useCallback(
    async (next: OpenBioFigureProject) => {
      if (editorRef.current) await replaceProject(next);
      else await activateProject(next);
    },
    [activateProject, replaceProject],
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
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        editor.nudgeSelection(
          event.key === "ArrowLeft"
            ? -distance
            : event.key === "ArrowRight"
              ? distance
              : 0,
          event.key === "ArrowUp"
            ? -distance
            : event.key === "ArrowDown"
              ? distance
              : 0,
        );
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
    if (!ready || view !== "editor" || !editorRef.current) return;
    const frame = window.requestAnimationFrame(fitToScreen);
    return () => window.cancelAnimationFrame(frame);
  }, [ready, view, fitToScreen]);

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
      rememberAssetUse(asset.id);
      setTab("licensing");
    },
    [],
  );

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-openbiofigure-asset");
    const asset = await seedProvider.find(id);
    if (!asset) return;
    const canvas = document
      .querySelector(".canvas-container")
      ?.getBoundingClientRect();
    if (!canvas) return;
    await addAsset(asset, {
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
  const exportPublicationReport = async () => {
    const contents = buildPublicationReport(project);
    const filename = `${safeFileStem(project.metadata.title)}-publication-report.md`;
    if (
      !(await saveDesktopTextFile(contents, filename, [
        { name: "Markdown", extensions: ["md"] },
      ]))
    )
      makeDownload(contents, "text/markdown", filename);
  };

  const openDesktopProject = async () => {
    const file = await openDesktopTextFile([
      { name: "OpenBioFigure project", extensions: ["obf.json", "json"] },
    ]);
    if (!file) return;
    try {
      await openOrReplaceProject(
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
      await openOrReplaceProject(next);
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

  const applyPreferences = (next: OpenBioFigureProject) => {
    next.settings.grid.size = preferences.gridSize;
    next.settings.grid.snap = preferences.snapToGrid;
    return next;
  };

  const requestOpenProject = () => {
    if (isDesktopRuntime()) void openDesktopProject();
    else openProjectRef.current?.click();
  };

  useEffect(() => {
    const onApplicationShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || target.isContentEditable)
        return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewDialog(true);
      } else if (mod && event.key.toLowerCase() === "o") {
        event.preventDefault();
        requestOpenProject();
      } else if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void exportProject();
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsDialog(true);
      }
    };
    window.addEventListener("keydown", onApplicationShortcut);
    return () => window.removeEventListener("keydown", onApplicationShortcut);
  });

  const goHome = () => {
    window.sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    setView("home");
  };

  const openSettings = (returnTo: "home" | "editor") => {
    setSettingsReturnView(returnTo);
    setView("settings");
  };

  const exitApp = () => {
    if (isDesktopRuntime()) {
      void import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
        getCurrentWindow().close(),
      );
      return;
    }
    goHome();
  };

  const sharedFileInput = (
    <input
      ref={openProjectRef}
      className="visually-hidden"
      type="file"
      accept=".json,.obf.json,application/json"
      onChange={(event) => void openProject(event)}
    />
  );

  const sharedOverlays = (
    <>
      {newDialog && (
        <NewDocumentDialog
          initialPreset={preferences.defaultPreset}
          onClose={() => setNewDialog(false)}
          onCreateTemplate={(templateId) => {
            void activateProject(
              applyPreferences(createTemplateProject(templateId)),
            ).then(() => {
              setNewDialog(false);
              window.requestAnimationFrame(fitToScreen);
            });
          }}
          onCreate={(preset, width, height) => {
            const next = applyPreferences(
              createProject(preset, { width, height }),
            );
            const operation = editorRef.current
              ? replaceProject(next)
              : activateProject(next);
            void operation.then(() => {
              setNewDialog(false);
              window.requestAnimationFrame(fitToScreen);
            });
          }}
        />
      )}
      {shortcutsDialog && (
        <KeyboardShortcutsDialog onClose={() => setShortcutsDialog(false)} />
      )}
      {chartDialog && (
        <ChartDialog
          onClose={() => setChartDialog(false)}
          onCreate={async (spec) => {
            await editorRef.current?.addProjectObject(
              createChartObject(
                spec,
                project.document.width / 2,
                project.document.height / 2,
              ),
            );
            setChartDialog(false);
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );

  if (!ready) {
    return (
      <main className="app-loading" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <p>Opening OpenBioFigure…</p>
      </main>
    );
  }

  if (view === "home") {
    return (
      <>
        <StartScreen
          autosave={autosaveProject}
          recent={recentProjects.slice(0, preferences.recentProjectCount)}
          onNew={() => setNewDialog(true)}
          onOpen={requestOpenProject}
          onContinue={() =>
            autosaveProject && void activateProject(autosaveProject)
          }
          onOpenRecent={(next) => void activateProject(next)}
          onRemoveRecent={(projectId) => {
            void storage.removeRecent(projectId).then(refreshRecent);
          }}
          onCreateTemplate={(templateId) =>
            void activateProject(
              applyPreferences(createTemplateProject(templateId)),
            )
          }
          onSettings={() => openSettings("home")}
        />
        {sharedFileInput}
        {sharedOverlays}
      </>
    );
  }

  if (view === "settings") {
    return (
      <>
        <SettingsScreen
          initialSection={
            settingsReturnView === "editor" ? "editor" : "general"
          }
          preferences={preferences}
          recentCount={recentProjects.length}
          onBack={() => {
            if (settingsReturnView === "editor") void activateProject(project);
            else setView("home");
          }}
          onPreferencesChange={(updates: Partial<AppPreferences>) =>
            setPreferences((current) => ({ ...current, ...updates }))
          }
          onClearRecent={() => {
            void storage.clearRecent().then(refreshRecent);
          }}
        />
        {sharedFileInput}
        {sharedOverlays}
      </>
    );
  }

  return (
    <div className="app-shell">
      <ApplicationMenuBar
        getEditor={() => editorRef.current}
        selection={selection}
        canUndo={historyRef.current.canUndo}
        canRedo={historyRef.current.canRedo}
        gridEnabled={project.settings.grid.enabled}
        onHome={goHome}
        onNew={() => setNewDialog(true)}
        onOpen={requestOpenProject}
        onSave={() => void exportProject()}
        onExportSvg={() => void exportSvg()}
        onExportPng={() => void exportPng()}
        onUndo={() => void undo()}
        onRedo={() => void redo()}
        onFit={fitToScreen}
        onZoomIn={() => setZoom((current) => Math.min(3, current + 0.1))}
        onZoomOut={() => setZoom((current) => Math.max(0.1, current - 0.1))}
        onToggleGrid={() => {
          const next = structuredClone(project);
          next.settings.grid.enabled = !next.settings.grid.enabled;
          void replaceProject(next, false);
        }}
        onOpenAssets={() =>
          document
            .querySelector<HTMLInputElement>(
              "[aria-label='Search scientific assets']",
            )
            ?.focus()
        }
        onOpenLayers={() => setTab("layers")}
        onOpenLicensing={() => setTab("licensing")}
        onShortcuts={() => setShortcutsDialog(true)}
        onSettings={() => openSettings("editor")}
        onExit={exitApp}
      />
      <EditorToolbar
        getEditor={() => editorRef.current}
        selection={selection}
        canUndo={historyRef.current.canUndo}
        canRedo={historyRef.current.canRedo}
        panning={panning}
        title={project.metadata.title}
        exportScale={exportScale}
        onNew={() => setNewDialog(true)}
        onRequestOpenProject={requestOpenProject}
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
        onExportScaleChange={(pngExportScale) => {
          if (![1, 2, 3, 4].includes(pngExportScale)) return;
          setPreferences((current) => ({
            ...current,
            pngExportScale: pngExportScale as AppPreferences["pngExportScale"],
          }));
        }}
        onExportSvg={() => void exportSvg()}
        onExportPng={() => void exportPng()}
      />

      <div className="editor-grid">
        <Suspense
          fallback={
            <aside className="left-panel panel-loading" aria-busy="true">
              <p className="eyebrow">{localized.assets}</p>
              <p>Loading verified catalog…</p>
            </aside>
          }
        >
          <AssetsPanel
            locale={locale}
            filters={filters}
            setFilters={setFilters}
            onAdd={addAsset}
            onInsertScientific={(kind) =>
              editorRef.current?.addScientificElement(kind)
            }
            onCreateChart={() => setChartDialog(true)}
            onFile={(event) => void handleSvgFile(event)}
            onRequestFile={
              isDesktopRuntime() ? () => void importDesktopSvg() : undefined
            }
          />
        </Suspense>
        <WorkspaceCanvas
          project={project}
          zoom={zoom}
          panning={panning}
          canvasRef={canvasRef}
          workspaceRef={workspaceRef}
          onDrop={(event) => void handleDrop(event)}
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
          onExportPublicationReport={() => void exportPublicationReport()}
        />
      </div>

      <EditorStatus
        saveState={saveState}
        selection={selection}
        publication={publication}
        labels={localized}
        onOpenLicensing={() => setTab("licensing")}
      />
      {sharedFileInput}
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
      {sharedOverlays}
    </div>
  );
}
