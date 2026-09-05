import {
  ActiveSelection,
  Canvas,
  Ellipse,
  FabricObject,
  Group,
  IText,
  Line,
  Rect,
  Triangle,
  loadSVGFromString,
  util,
} from "fabric";
import type { ProjectAsset } from "../domain/assets/schema";
import { sanitizeSvg } from "../domain/assets/sanitize";
import type {
  OpenBioFigureProject,
  ProjectObject,
} from "../domain/project/schema";
import {
  createScientificElement,
  type ScientificElementKind,
} from "../domain/scientific/elements";

type ObjectKind = ProjectObject["kind"];
type ManagedObject = FabricObject & {
  obfId?: string;
  obfKind?: ObjectKind;
  obfName?: string;
  obfAssetId?: string;
};

export interface SelectionSnapshot {
  count: number;
  id: string | null;
  kind: ObjectKind | "mixed" | null;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  locked: boolean;
  visible: boolean;
}

export interface LayerSnapshot {
  id: string;
  name: string;
  kind: ObjectKind;
  locked: boolean;
  visible: boolean;
  selected: boolean;
}

export interface EditorSnapshot {
  project: OpenBioFigureProject;
  selection: SelectionSnapshot | null;
  layers: LayerSnapshot[];
}

const newId = (): string => globalThis.crypto.randomUUID();

const defaults = {
  fill: "#DFF4F5",
  stroke: "#066F79",
  strokeWidth: 2,
  opacity: 1,
  originX: "center" as const,
  originY: "center" as const,
};

function tag(
  object: FabricObject,
  kind: ObjectKind,
  name: string,
  id = newId(),
): ManagedObject {
  const managed = object as ManagedObject;
  managed.obfId = id;
  managed.obfKind = kind;
  managed.obfName = name;
  object.set({ originX: "center", originY: "center" });
  return managed;
}

function colorValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function common(object: ManagedObject) {
  return {
    id: object.obfId ?? newId(),
    name: object.obfName ?? "Object",
    x: object.left,
    y: object.top,
    width: Math.max(0.1, object.width),
    height: Math.max(0.1, object.height),
    scaleX: Math.max(0.001, object.scaleX),
    scaleY: Math.max(0.001, object.scaleY),
    angle: object.angle,
    opacity: object.opacity,
    visible: object.visible,
    locked: !object.selectable,
    fill: colorValue(object.fill),
    stroke: colorValue(object.stroke),
    strokeWidth: object.strokeWidth,
  };
}

function serializeObject(object: ManagedObject): ProjectObject {
  const kind = object.obfKind ?? "rect";
  const base = common(object);
  if (kind === "text") {
    const text = object as IText & ManagedObject;
    return {
      ...base,
      kind,
      text: text.text,
      fontFamily: text.fontFamily,
      fontSize: text.fontSize,
      fontWeight: text.fontWeight,
      textAlign: text.textAlign as "left" | "center" | "right" | "justify",
    };
  }
  if (kind === "svg")
    return { ...base, kind, assetId: object.obfAssetId ?? "unknown" };
  if (kind === "line" || kind === "arrow" || kind === "connector") {
    return {
      ...base,
      kind,
      points: [0, base.height / 2, base.width, base.height / 2],
    };
  }
  if (kind === "group") {
    const group = object as Group & ManagedObject;
    return {
      ...base,
      kind,
      children: group
        .getObjects()
        .map((child) => serializeObject(child as ManagedObject)),
    };
  }
  return { ...base, kind };
}

function applyCommon(
  object: FabricObject,
  value: ProjectObject,
): ManagedObject {
  object.set({
    left: value.x,
    top: value.y,
    width: value.width,
    height: value.height,
    scaleX: value.scaleX,
    scaleY: value.scaleY,
    angle: value.angle,
    opacity: value.opacity,
    visible: value.visible,
    fill: value.fill ?? undefined,
    stroke: value.stroke ?? undefined,
    strokeWidth: value.strokeWidth,
    selectable: !value.locked,
    evented: !value.locked,
    lockMovementX: value.locked,
    lockMovementY: value.locked,
    originX: "center",
    originY: "center",
  });
  return tag(object, value.kind, value.name, value.id);
}

function makeArrow(width = 180, color = "#263238"): Group {
  const line = new Line([-width / 2, 0, width / 2 - 12, 0], {
    stroke: color,
    strokeWidth: 3,
    originX: "center",
    originY: "center",
  });
  const head = new Triangle({
    width: 14,
    height: 16,
    fill: color,
    left: width / 2 - 5,
    top: 0,
    angle: 90,
    originX: "center",
    originY: "center",
  });
  return new Group([line, head], { originX: "center", originY: "center" });
}

async function objectFromProject(
  value: ProjectObject,
  assets: ProjectAsset[],
): Promise<ManagedObject> {
  let object: FabricObject;
  if (value.kind === "rect")
    object = new Rect({
      ...defaults,
      width: value.width,
      height: value.height,
    });
  else if (value.kind === "ellipse") {
    object = new Ellipse({
      ...defaults,
      rx: value.width / 2,
      ry: value.height / 2,
    });
  } else if (value.kind === "text") {
    object = new IText(value.text, {
      fill: value.fill ?? "#263238",
      fontFamily: value.fontFamily,
      fontSize: value.fontSize,
      fontWeight: value.fontWeight,
      textAlign: value.textAlign,
      originX: "center",
      originY: "center",
    });
  } else if (value.kind === "line" || value.kind === "connector") {
    object = new Line([0, 0, value.width, 0], {
      stroke: value.stroke ?? "#263238",
      strokeWidth: value.strokeWidth,
      originX: "center",
      originY: "center",
    });
  } else if (value.kind === "arrow")
    object = makeArrow(value.width, value.stroke ?? "#263238");
  else if (value.kind === "svg") {
    const asset = assets.find((candidate) => candidate.id === value.assetId);
    if (!asset) throw new Error(`Missing project asset ${value.assetId}.`);
    const parsed = await loadSVGFromString(sanitizeSvg(asset.svg).svg);
    object = util.groupSVGElements(
      parsed.objects.filter((item): item is FabricObject => Boolean(item)),
    );
    (object as ManagedObject).obfAssetId = value.assetId;
  } else if (value.kind === "group") {
    const children = await Promise.all(
      value.children.map((child: ProjectObject) =>
        objectFromProject(child, assets),
      ),
    );
    object = new Group(children, { originX: "center", originY: "center" });
  } else {
    throw new Error(
      `Unsupported object kind: ${String((value as { kind?: unknown }).kind)}`,
    );
  }
  return applyCommon(object, value);
}

function cloneProjectObject(value: ProjectObject, offset = 18): ProjectObject {
  const cloned = structuredClone(value);
  const renew = (item: ProjectObject) => {
    item.id = newId();
    item.x += offset;
    item.y += offset;
    if (item.kind === "group") item.children.forEach(renew);
  };
  renew(cloned);
  return cloned;
}

export class FabricEditor {
  readonly canvas: Canvas;
  #project: OpenBioFigureProject;
  #onChange: (snapshot: EditorSnapshot) => void;
  #suspend = false;
  #clipboard: ProjectObject[] = [];

  constructor(
    element: HTMLCanvasElement,
    project: OpenBioFigureProject,
    onChange: (snapshot: EditorSnapshot) => void,
  ) {
    this.#project = structuredClone(project);
    this.#onChange = onChange;
    this.canvas = new Canvas(element, {
      width: project.document.width,
      height: project.document.height,
      backgroundColor: project.document.background,
      preserveObjectStacking: true,
      selectionColor: "rgba(8, 127, 140, 0.10)",
      selectionBorderColor: "#066F79",
      selectionLineWidth: 1,
    });
    Object.assign(FabricObject.ownDefaults, {
      borderColor: "#066F79",
      cornerColor: "#FFFFFF",
      cornerStrokeColor: "#066F79",
      cornerStyle: "circle",
      transparentCorners: false,
      padding: 2,
    });
    this.canvas.on("object:modified", () => this.commit());
    this.canvas.on("object:moving", ({ target }) => {
      if (!target || !this.#project.settings.grid.snap) return;
      const size = this.#project.settings.grid.size;
      target.set({
        left: Math.round(target.left / size) * size,
        top: Math.round(target.top / size) * size,
      });
    });
    this.canvas.on("selection:created", () => this.emit());
    this.canvas.on("selection:updated", () => this.emit());
    this.canvas.on("selection:cleared", () => this.emit());
    this.canvas.on("text:changed", () => this.commit());
    void this.load(project);
  }

  dispose() {
    void this.canvas.dispose();
  }

  async load(project: OpenBioFigureProject) {
    this.#suspend = true;
    this.#project = structuredClone(project);
    this.canvas.clear();
    this.canvas.setDimensions({
      width: project.document.width,
      height: project.document.height,
    });
    this.canvas.backgroundColor = project.document.background;
    for (const value of project.objects)
      this.canvas.add(await objectFromProject(value, project.assets));
    this.canvas.requestRenderAll();
    this.#suspend = false;
    this.emit();
  }

  getProject(): OpenBioFigureProject {
    return structuredClone(this.#project);
  }

  private syncProject(touch = false) {
    this.#project.objects = this.canvas
      .getObjects()
      .map((object) => serializeObject(object as ManagedObject));
    this.#project.document.background =
      typeof this.canvas.backgroundColor === "string"
        ? this.canvas.backgroundColor
        : "#ffffff";
    if (touch) this.#project.metadata.updatedAt = new Date().toISOString();
  }

  private commit() {
    if (this.#suspend) return;
    this.syncProject(true);
    this.emit();
  }

  private emit() {
    if (this.#suspend) return;
    this.#onChange({
      project: this.getProject(),
      selection: this.getSelection(),
      layers: this.getLayers(),
    });
  }

  private center() {
    return {
      x: this.#project.document.width / 2,
      y: this.#project.document.height / 2,
    };
  }

  addRect() {
    const { x, y } = this.center();
    const object = tag(
      new Rect({ ...defaults, width: 180, height: 110, left: x, top: y }),
      "rect",
      "Rectangle",
    );
    this.addAndSelect(object);
  }

  addEllipse() {
    const { x, y } = this.center();
    const object = tag(
      new Ellipse({ ...defaults, rx: 75, ry: 55, left: x, top: y }),
      "ellipse",
      "Ellipse",
    );
    this.addAndSelect(object);
  }

  addText() {
    const { x, y } = this.center();
    const object = tag(
      new IText("Scientific label", {
        left: x,
        top: y,
        fill: "#263238",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 30,
        originX: "center",
        originY: "center",
      }),
      "text",
      "Text",
    );
    this.addAndSelect(object);
  }

  addLine(kind: "line" | "connector" = "line") {
    const { x, y } = this.center();
    const object = tag(
      new Line([-90, 0, 90, 0], {
        left: x,
        top: y,
        stroke: "#263238",
        strokeWidth: 3,
        originX: "center",
        originY: "center",
      }),
      kind,
      kind === "line" ? "Line" : "Connector",
    );
    this.addAndSelect(object);
  }

  addArrow() {
    const { x, y } = this.center();
    const object = tag(makeArrow(), "arrow", "Arrow");
    object.set({ left: x, top: y });
    this.addAndSelect(object);
  }

  async addScientificElement(kind: ScientificElementKind) {
    const { x, y } = this.center();
    const object = await objectFromProject(
      createScientificElement(kind, x, y),
      this.#project.assets,
    );
    this.addAndSelect(object);
  }

  async addProjectObject(value: ProjectObject) {
    const object = await objectFromProject(value, this.#project.assets);
    this.addAndSelect(object);
  }

  async addAsset(asset: ProjectAsset, point?: { x: number; y: number }) {
    const parsed = await loadSVGFromString(sanitizeSvg(asset.svg).svg);
    const object = util.groupSVGElements(
      parsed.objects.filter((item): item is FabricObject => Boolean(item)),
    );
    const max = 220;
    const scale = Math.min(max / Math.max(object.width, object.height), 1);
    const target = point ?? this.center();
    const managed = tag(object, "svg", asset.title);
    managed.obfAssetId = asset.id;
    managed.set({
      left: target.x,
      top: target.y,
      scaleX: scale,
      scaleY: scale,
    });
    if (!this.#project.assets.some((candidate) => candidate.id === asset.id))
      this.#project.assets.push(asset);
    this.addAndSelect(managed);
  }

  private addAndSelect(object: FabricObject) {
    this.canvas.add(object);
    this.canvas.setActiveObject(object);
    this.canvas.requestRenderAll();
    this.commit();
  }

  getSelection(): SelectionSnapshot | null {
    const active = this.canvas.getActiveObject();
    if (!active) return null;
    const selected =
      active instanceof ActiveSelection ? active.getObjects() : [active];
    const kinds = new Set(
      selected.map((item) => (item as ManagedObject).obfKind),
    );
    const base: ManagedObject =
      selected.length === 1 ? (selected[0] as ManagedObject) : active;
    const text = base as IText & ManagedObject;
    return {
      count: selected.length,
      id: selected.length === 1 ? (base.obfId ?? null) : null,
      kind: kinds.size === 1 ? ([...kinds][0] ?? null) : "mixed",
      name:
        selected.length === 1
          ? (base.obfName ?? "Object")
          : `${selected.length} objects`,
      x: Math.round(active.left),
      y: Math.round(active.top),
      width: Math.round(active.getScaledWidth()),
      height: Math.round(active.getScaledHeight()),
      angle: Math.round(active.angle),
      opacity: active.opacity,
      fill: colorValue(base.fill),
      stroke: colorValue(base.stroke),
      strokeWidth: base.strokeWidth,
      fontFamily: text.fontFamily,
      fontSize: text.fontSize,
      textAlign: text.textAlign as SelectionSnapshot["textAlign"],
      locked: selected.every((item) => !item.selectable),
      visible: selected.every((item) => item.visible),
    };
  }

  getLayers(): LayerSnapshot[] {
    const selected = new Set(this.canvas.getActiveObjects());
    return [...this.canvas.getObjects()].reverse().map((object) => {
      const managed = object as ManagedObject;
      return {
        id: managed.obfId ?? "",
        name: managed.obfName ?? "Object",
        kind: managed.obfKind ?? "rect",
        locked: !managed.selectable,
        visible: managed.visible,
        selected: selected.has(object),
      };
    });
  }

  select(id: string) {
    const object = this.canvas
      .getObjects()
      .find((item) => (item as ManagedObject).obfId === id);
    if (object && object.visible) {
      this.canvas.setActiveObject(object);
      this.canvas.requestRenderAll();
      this.emit();
    }
  }

  updateSelection(values: Partial<SelectionSnapshot>) {
    const objects = this.canvas.getActiveObjects();
    if (!objects.length) return;
    for (const object of objects) {
      const next: Record<string, unknown> = {};
      if (values.fill !== undefined) next.fill = values.fill;
      if (values.stroke !== undefined) next.stroke = values.stroke;
      if (values.strokeWidth !== undefined)
        next.strokeWidth = values.strokeWidth;
      if (values.opacity !== undefined) next.opacity = values.opacity;
      if (values.fontFamily !== undefined && object instanceof IText)
        next.fontFamily = values.fontFamily;
      if (values.fontSize !== undefined && object instanceof IText)
        next.fontSize = values.fontSize;
      if (values.textAlign !== undefined && object instanceof IText)
        next.textAlign = values.textAlign;
      object.set(next);
      if (values.name !== undefined)
        (object as ManagedObject).obfName = values.name;
      const managed = object as ManagedObject;
      if (
        managed.obfKind === "arrow" &&
        values.stroke !== undefined &&
        object instanceof Group
      ) {
        const [line, head] = object.getObjects();
        line?.set("stroke", values.stroke);
        head?.set("fill", values.stroke);
      }
      if (
        managed.obfKind === "svg" &&
        managed.obfAssetId &&
        (values.fill !== undefined || values.stroke !== undefined)
      ) {
        const asset = this.#project.assets.find(
          (candidate) => candidate.id === managed.obfAssetId,
        );
        if (asset) {
          asset.attribution.modified = true;
          asset.attribution.modificationNotes =
            "Visual style adjusted in OpenBioFigure.";
        }
      }
    }
    const active = this.canvas.getActiveObject();
    if (active) {
      if (values.x !== undefined) active.set("left", values.x);
      if (values.y !== undefined) active.set("top", values.y);
      if (values.angle !== undefined) active.set("angle", values.angle);
      if (
        values.width !== undefined &&
        values.width > 0 &&
        objects.length === 1
      )
        active.scaleX *= values.width / active.getScaledWidth();
      if (
        values.height !== undefined &&
        values.height > 0 &&
        objects.length === 1
      )
        active.scaleY *= values.height / active.getScaledHeight();
      active.setCoords();
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  nudgeSelection(x: number, y: number) {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set({ left: active.left + x, top: active.top + y });
    active.setCoords();
    this.canvas.requestRenderAll();
    this.commit();
  }

  setBackground(color: string) {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.commit();
  }

  deleteSelection() {
    const objects = this.canvas.getActiveObjects();
    this.canvas.discardActiveObject();
    this.canvas.remove(...objects);
    this.canvas.requestRenderAll();
    this.commit();
  }

  copy() {
    this.#clipboard = this.canvas
      .getActiveObjects()
      .map((item) => serializeObject(item as ManagedObject));
  }

  async paste() {
    if (!this.#clipboard.length) return;
    const created = await Promise.all(
      this.#clipboard.map((item) =>
        objectFromProject(cloneProjectObject(item), this.#project.assets),
      ),
    );
    this.canvas.add(...created);
    const active =
      created.length === 1
        ? created[0]
        : new ActiveSelection(created, { canvas: this.canvas });
    if (active) this.canvas.setActiveObject(active);
    this.canvas.requestRenderAll();
    this.commit();
  }

  async duplicate() {
    this.copy();
    await this.paste();
  }

  group() {
    const active = this.canvas.getActiveObject();
    if (!(active instanceof ActiveSelection)) return;
    const objects = active.getObjects();
    this.canvas.discardActiveObject();
    this.canvas.remove(...objects);
    const group = tag(
      new Group(objects, { originX: "center", originY: "center" }),
      "group",
      "Group",
    );
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.commit();
  }

  ungroup() {
    const active = this.canvas.getActiveObject();
    if (
      !(active instanceof Group) ||
      (active as ManagedObject).obfKind !== "group"
    )
      return;
    const children = active.getObjects();
    this.canvas.discardActiveObject();
    active.remove(...children);
    this.canvas.remove(active);
    this.canvas.add(...children);
    this.canvas.setActiveObject(
      new ActiveSelection(children, { canvas: this.canvas }),
    );
    this.canvas.requestRenderAll();
    this.commit();
  }

  arrange(action: "forward" | "backward" | "front" | "back") {
    const object = this.canvas.getActiveObject();
    if (!object) return;
    if (action === "forward") this.canvas.bringObjectForward(object);
    if (action === "backward") this.canvas.sendObjectBackwards(object);
    if (action === "front") this.canvas.bringObjectToFront(object);
    if (action === "back") this.canvas.sendObjectToBack(object);
    this.canvas.requestRenderAll();
    this.commit();
  }

  moveLayer(id: string, direction: "up" | "down") {
    const objects = this.canvas.getObjects();
    const object = objects.find((item) => (item as ManagedObject).obfId === id);
    if (!object) return;
    const index = objects.indexOf(object);
    const target = Math.max(
      0,
      Math.min(objects.length - 1, index + (direction === "up" ? 1 : -1)),
    );
    this.canvas.moveObjectTo(object, target);
    this.canvas.requestRenderAll();
    this.commit();
  }

  toggleLayer(id: string, field: "visible" | "locked") {
    const object = this.canvas
      .getObjects()
      .find((item) => (item as ManagedObject).obfId === id);
    if (!object) return;
    if (field === "visible") {
      object.visible = !object.visible;
      if (!object.visible && this.canvas.getActiveObject() === object)
        this.canvas.discardActiveObject();
    } else {
      const locked = object.selectable;
      object.set({
        selectable: !locked,
        evented: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
      });
      if (locked) this.canvas.discardActiveObject();
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  align(mode: "left" | "center" | "right" | "top" | "middle" | "bottom") {
    const objects = this.canvas.getActiveObjects();
    if (objects.length < 2) return;
    const boxes = objects.map((object) => object.getBoundingRect());
    const left = Math.min(...boxes.map((box) => box.left));
    const right = Math.max(...boxes.map((box) => box.left + box.width));
    const top = Math.min(...boxes.map((box) => box.top));
    const bottom = Math.max(...boxes.map((box) => box.top + box.height));
    for (const object of objects) {
      const box = object.getBoundingRect();
      if (mode === "left") object.left += left - box.left;
      if (mode === "right") object.left += right - (box.left + box.width);
      if (mode === "center")
        object.left += (left + right) / 2 - (box.left + box.width / 2);
      if (mode === "top") object.top += top - box.top;
      if (mode === "bottom") object.top += bottom - (box.top + box.height);
      if (mode === "middle")
        object.top += (top + bottom) / 2 - (box.top + box.height / 2);
      object.setCoords();
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  distribute(axis: "horizontal" | "vertical") {
    const objects = [...this.canvas.getActiveObjects()];
    if (objects.length < 3) return;
    objects.sort((a, b) =>
      axis === "horizontal" ? a.left - b.left : a.top - b.top,
    );
    const first = axis === "horizontal" ? objects[0]!.left : objects[0]!.top;
    const last =
      axis === "horizontal" ? objects.at(-1)!.left : objects.at(-1)!.top;
    objects.forEach((object, index) => {
      const next = first + ((last - first) * index) / (objects.length - 1);
      object.set(axis === "horizontal" ? "left" : "top", next);
      object.setCoords();
    });
    this.canvas.requestRenderAll();
    this.commit();
  }

  getSvg() {
    return this.canvas.toSVG();
  }

  getPng(scale: number) {
    return this.canvas.toDataURL({ format: "png", multiplier: scale });
  }
}
