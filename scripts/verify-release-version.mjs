import { readFile } from "node:fs/promises";

const tag = process.env.GITHUB_REF_NAME;
if (!tag?.startsWith("v")) throw new Error("Release tag is unavailable.");

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tauriConfig = JSON.parse(
  await readFile("src-tauri/tauri.conf.json", "utf8"),
);
const expected = tag.slice(1);
if (packageJson.version !== expected || tauriConfig.version !== expected) {
  throw new Error(
    `Release ${tag} does not match package (${packageJson.version}) and Tauri (${tauriConfig.version}) versions.`,
  );
}
console.log(`Release version ${tag} matches all manifests.`);
