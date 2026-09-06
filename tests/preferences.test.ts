import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  applyAppearancePreferences,
  loadPreferences,
  normalizePreferences,
  savePreferences,
} from "../src/domain/preferences/preferences";

describe("application preferences", () => {
  let storage: Storage;

  beforeEach(() => {
    const values = new Map<string, string>();
    storage = {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => void values.delete(key),
      setItem: (key, value) => void values.set(key, value),
    };
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-density");
    document.documentElement.removeAttribute("data-reduce-motion");
  });

  it("normalizes invalid persisted values to safe defaults", () => {
    expect(
      normalizePreferences({
        theme: "neon",
        density: "tiny",
        recentProjectCount: 100,
        defaultPreset: "unknown",
        gridSize: 1,
        pngExportScale: 9,
      }),
    ).toEqual(DEFAULT_PREFERENCES);
  });

  it("migrates existing grid preferences without losing them", () => {
    storage.setItem(
      "openbiofigure:preferences:v1",
      JSON.stringify({ gridSize: 32, snapToGrid: true }),
    );

    expect(loadPreferences(storage)).toMatchObject({
      gridSize: 32,
      snapToGrid: true,
      theme: "system",
      pngExportScale: 2,
    });
  });

  it("persists preferences and applies appearance attributes", () => {
    const preferences = {
      ...DEFAULT_PREFERENCES,
      theme: "dark" as const,
      density: "compact" as const,
      reduceMotion: true,
      pngExportScale: 4 as const,
    };

    savePreferences(storage, preferences);
    applyAppearancePreferences(preferences);

    expect(JSON.parse(storage.getItem(PREFERENCES_KEY) ?? "{}")).toMatchObject(
      preferences,
    );
    expect(document.documentElement.dataset).toMatchObject({
      theme: "dark",
      density: "compact",
      reduceMotion: "true",
    });
  });

  it("lets system theme resolve through CSS rather than a stale override", () => {
    document.documentElement.dataset.theme = "dark";
    applyAppearancePreferences(DEFAULT_PREFERENCES);

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
