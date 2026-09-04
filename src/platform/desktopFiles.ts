import { isTauri } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenedTextFile {
  contents: string;
  fileName: string;
}

export const isDesktopRuntime = (): boolean => isTauri();

export async function openDesktopTextFile(
  filters: FileFilter[],
): Promise<OpenedTextFile | null> {
  if (!isDesktopRuntime()) return null;
  const path = await open({ multiple: false, directory: false, filters });
  if (!path) return null;
  return {
    contents: await readTextFile(path),
    fileName: path.split(/[\\/]/).at(-1) ?? "imported-file",
  };
}

export async function saveDesktopTextFile(
  contents: string,
  defaultName: string,
  filters: FileFilter[],
): Promise<boolean> {
  if (!isDesktopRuntime()) return false;
  const path = await save({ defaultPath: defaultName, filters });
  if (path) await writeTextFile(path, contents);
  return true;
}

export async function saveDesktopBinaryFile(
  contents: Uint8Array,
  defaultName: string,
  filters: FileFilter[],
): Promise<boolean> {
  if (!isDesktopRuntime()) return false;
  const path = await save({ defaultPath: defaultName, filters });
  if (path) await writeFile(path, contents);
  return true;
}

export async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
}
