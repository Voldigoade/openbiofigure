import { readFile } from "node:fs/promises";

const tag = process.env.GITHUB_REF_NAME;
if (!tag?.startsWith("v")) throw new Error("Release tag is unavailable.");

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tauriConfig = JSON.parse(
  await readFile("src-tauri/tauri.conf.json", "utf8"),
);
const expected = tag.slice(1);
const desktopUrl = tauriConfig.app?.windows?.[0]?.url;
const desktopRecoveryVersion = new URL(
  desktopUrl ?? "index.html",
  "https://tauri.localhost/",
).searchParams.get("desktop-recovery");
if (
  packageJson.version !== expected ||
  tauriConfig.version !== expected ||
  desktopRecoveryVersion !== expected
) {
  throw new Error(
    `Release ${tag} does not match package (${packageJson.version}), Tauri (${tauriConfig.version}), and desktop recovery (${desktopRecoveryVersion}) versions.`,
  );
}
console.log(`Release version ${tag} matches all manifests.`);
