import { del, get, set } from "idb-keyval";
import { migrateProject } from "../project/migrations";
import type { OpenBioFigureProject } from "../project/schema";

const AUTOSAVE_KEY = "openbiofigure:autosave:v1";

export interface ProjectStorage {
  load(): Promise<OpenBioFigureProject | null>;
  save(project: OpenBioFigureProject): Promise<void>;
  clear(): Promise<void>;
}

export class IndexedDbProjectStorage implements ProjectStorage {
  async load() {
    const value: unknown = await get(AUTOSAVE_KEY);
    return value ? migrateProject(value) : null;
  }

  async save(project: OpenBioFigureProject) {
    await set(AUTOSAVE_KEY, project);
  }

  async clear() {
    await del(AUTOSAVE_KEY);
  }
}

export class MemoryProjectStorage implements ProjectStorage {
  #value: OpenBioFigureProject | null = null;

  load(): Promise<OpenBioFigureProject | null> {
    return Promise.resolve(this.#value ? structuredClone(this.#value) : null);
  }

  save(project: OpenBioFigureProject): Promise<void> {
    this.#value = structuredClone(project);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.#value = null;
    return Promise.resolve();
  }
}
