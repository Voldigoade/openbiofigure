import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  BoxSelect,
  Circle,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Group,
  Hand,
  ImageDown,
  Minus,
  MousePointer2,
  Redo2,
  Square,
  TextCursorInput,
  Trash2,
  Undo2,
  Ungroup,
} from "lucide-react";
import { IconButton } from "../components/ui/IconButton";
import type { FabricEditor, SelectionSnapshot } from "../editor/FabricEditor";

interface EditorToolbarProps {
  getEditor: () => FabricEditor | null;
  selection: SelectionSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
  panning: boolean;
  title: string;
  exportScale: number;
  onNew: () => void;
  onRequestOpenProject: () => void;
  onSaveProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPanningChange: (active: boolean) => void;
  onTitleChange: (title: string) => void;
  onExportScaleChange: (scale: number) => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}

export function EditorToolbar({
  getEditor,
  selection,
  canUndo,
  canRedo,
  panning,
  title,
  exportScale,
  onNew,
  onRequestOpenProject,
  onSaveProject,
  onUndo,
  onRedo,
  onPanningChange,
  onTitleChange,
  onExportScaleChange,
  onExportSvg,
  onExportPng,
}: EditorToolbarProps) {
  return (
    <header className="topbar">
      <div className="toolbar-group document-actions">
        <IconButton label="New document" onClick={onNew}>
          <FilePlus2 />
        </IconButton>
        <IconButton label="Open project" onClick={onRequestOpenProject}>
          <FolderOpen />
        </IconButton>
        <IconButton
          label="Save project file"
          onClick={onSaveProject}
          testId="save-project"
        >
          <Download />
        </IconButton>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <IconButton
          label="Undo"
          onClick={onUndo}
          disabled={!canUndo}
          testId="undo"
        >
          <Undo2 />
        </IconButton>
        <IconButton
          label="Redo"
          onClick={onRedo}
          disabled={!canRedo}
          testId="redo"
        >
          <Redo2 />
        </IconButton>
        <IconButton
          label="Duplicate selection"
          onClick={() => void getEditor()?.duplicate()}
          disabled={!selection}
        >
          <Copy />
        </IconButton>
        <IconButton
          label="Delete selection"
          onClick={() => getEditor()?.deleteSelection()}
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
          onClick={() => onPanningChange(false)}
        >
          <MousePointer2 />
        </IconButton>
        <IconButton
          label="Pan tool"
          active={panning}
          onClick={() => onPanningChange(!panning)}
        >
          <Hand />
        </IconButton>
        <IconButton
          label="Add text"
          onClick={() => getEditor()?.addText()}
          testId="add-text"
        >
          <TextCursorInput />
        </IconButton>
        <IconButton
          label="Add rectangle"
          onClick={() => getEditor()?.addRect()}
          testId="add-rectangle"
        >
          <Square />
        </IconButton>
        <IconButton
          label="Add ellipse"
          onClick={() => getEditor()?.addEllipse()}
        >
          <Circle />
        </IconButton>
        <IconButton label="Add line" onClick={() => getEditor()?.addLine()}>
          <Minus />
        </IconButton>
        <IconButton label="Add arrow" onClick={() => getEditor()?.addArrow()}>
          <ArrowRight />
        </IconButton>
        <IconButton
          label="Add connector"
          onClick={() => getEditor()?.addLine("connector")}
        >
          <BoxSelect />
        </IconButton>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group arrange-tools">
        <IconButton
          label="Group selection"
          onClick={() => getEditor()?.group()}
          disabled={!selection || selection.count < 2}
        >
          <Group />
        </IconButton>
        <IconButton
          label="Ungroup selection"
          onClick={() => getEditor()?.ungroup()}
          disabled={selection?.kind !== "group"}
        >
          <Ungroup />
        </IconButton>
        <IconButton
          label="Bring to front"
          onClick={() => getEditor()?.arrange("front")}
          disabled={!selection}
        >
          <ArrowUpToLine />
        </IconButton>
        <IconButton
          label="Bring forward"
          onClick={() => getEditor()?.arrange("forward")}
          disabled={!selection}
        >
          <ArrowUp />
        </IconButton>
        <IconButton
          label="Send backward"
          onClick={() => getEditor()?.arrange("backward")}
          disabled={!selection}
        >
          <ArrowDown />
        </IconButton>
        <IconButton
          label="Send to back"
          onClick={() => getEditor()?.arrange("back")}
          disabled={!selection}
        >
          <ArrowDownToLine />
        </IconButton>
      </div>
      <div className="title-field">
        <input
          aria-label="Figure title"
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
        />
      </div>
      <div className="toolbar-group export-actions">
        <button
          type="button"
          className="button export-button"
          onClick={onExportSvg}
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
              onExportScaleChange(Number(event.currentTarget.value))
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
          onClick={onExportPng}
          data-testid="export-png"
        >
          <ImageDown /> PNG {exportScale}×
        </button>
      </div>
    </header>
  );
}
