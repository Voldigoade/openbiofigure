import { del, get, set } from "idb-keyval";
import { migrateProject } from "../project/migrations";
import type { OpenBioFigureProject } from "../project/schema";

const AUTOSAVE_KEY = "openbiofigure:autosave:v1";
const RECENT_PROJECTS_KEY = "openbiofigure:recent-projects:v1";
const MAX_RECENT_PROJECTS = 8;

export interface RecentProject {
  project: OpenBioFigureProject;
  lastOpenedAt: string;
}

export interface ProjectStorage {
  load(): Promise<OpenBioFigureProject | null>;
  save(project: OpenBioFigureProject): Promise<void>;
  clear(): Promise<void>;
  listRecent(): Promise<RecentProject[]>;
  removeRecent(projectId: string): Promise<void>;
  clearRecent(): Promise<void>;
}

function normalizeRecent(value: unknown): RecentProject[] {
  if (!Array.isArray(value)) return [];
  const projects: RecentProject[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<RecentProject>;
    if (typeof candidate.lastOpenedAt !== "string") continue;
    try {
      projects.push({
        project: migrateProject(candidate.project),
        lastOpenedAt: candidate.lastOpenedAt,
      });
    } catch {
      // Invalid local entries are ignored instead of blocking app startup.
    }
  }
  return projects
    .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
    .slice(0, MAX_RECENT_PROJECTS);
}

export class IndexedDbProjectStorage implements ProjectStorage {
  async load() {
    const value: unknown = await get(AUTOSAVE_KEY);
    return value ? migrateProject(value) : null;
  }

  async save(project: OpenBioFigureProject) {
    await set(AUTOSAVE_KEY, project);
    const recent = normalizeRecent(await get(RECENT_PROJECTS_KEY));
    const next = [
      { project, lastOpenedAt: new Date().toISOString() },
      ...recent.filter(
        (item) => item.project.metadata.id !== project.metadata.id,
      ),
    ].slice(0, MAX_RECENT_PROJECTS);
    await set(RECENT_PROJECTS_KEY, next);
  }

  async clear() {
    await del(AUTOSAVE_KEY);
  }

  async listRecent() {
    return normalizeRecent(await get(RECENT_PROJECTS_KEY));
  }

  async removeRecent(projectId: string) {
    const recent = normalizeRecent(await get(RECENT_PROJECTS_KEY));
    await set(
      RECENT_PROJECTS_KEY,
      recent.filter((item) => item.project.metadata.id !== projectId),
    );
  }

  async clearRecent() {
    await del(RECENT_PROJECTS_KEY);
  }
}

export class MemoryProjectStorage implements ProjectStorage {
  #value: OpenBioFigureProject | null = null;
  #recent: RecentProject[] = [];

  load(): Promise<OpenBioFigureProject | null> {
    return Promise.resolve(this.#value ? structuredClone(this.#value) : null);
  }

  save(project: OpenBioFigureProject): Promise<void> {
    this.#value = structuredClone(project);
    this.#recent = [
      {
        project: structuredClone(project),
        lastOpenedAt: new Date().toISOString(),
      },
      ...this.#recent.filter(
        (item) => item.project.metadata.id !== project.metadata.id,
      ),
    ].slice(0, MAX_RECENT_PROJECTS);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.#value = null;
    return Promise.resolve();
  }

  listRecent(): Promise<RecentProject[]> {
    return Promise.resolve(structuredClone(this.#recent));
  }

  removeRecent(projectId: string): Promise<void> {
    this.#recent = this.#recent.filter(
      (item) => item.project.metadata.id !== projectId,
    );
    return Promise.resolve();
  }

  clearRecent(): Promise<void> {
    this.#recent = [];
    return Promise.resolve();
  }
}
