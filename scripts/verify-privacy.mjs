import { readFile, readdir } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { homedir, hostname } from "node:os";

const root = process.cwd();
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);
const textExtensions = new Set([
  ".md",
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".yml",
  ".yaml",
  ".cff",
  ".css",
  ".html",
  ".svg",
  ".toml",
]);
const home = resolve(homedir()).replaceAll("\\", "/").toLowerCase();
const localUser = basename(homedir()).toLowerCase();
const machineName = hostname().toLowerCase();
const windowsUserPath = new RegExp(
  String.raw`[A-Z]:[\\/]+` + `Users` + String.raw`[\\/]+[^\s"'<>\\/]+`,
  "gi",
);
const unixUserPath = new RegExp(
  `/` + `(?:Users|home)` + String.raw`/[^\s"'<>/]+`,
  "gi",
);
const findings = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else {
      const extension = entry.name.includes(".")
        ? entry.name.slice(entry.name.lastIndexOf("."))
        : "";
      if (
        !textExtensions.has(extension) &&
        !["LICENSE", ".gitignore", ".editorconfig"].includes(entry.name)
      )
        continue;
      const content = await readFile(path, "utf8");
      const projectPath = relative(root, path);
      const normalized = content.replaceAll("\\", "/").toLowerCase();
      if (
        normalized.includes(home) ||
        (localUser.length > 3 && normalized.includes(`/users/${localUser}`))
      )
        findings.push(`${relative(root, path)}: local user path`);
      if (
        projectPath !== join("scripts", "verify-privacy.mjs") &&
        (windowsUserPath.test(content) || unixUserPath.test(content))
      )
        findings.push(`${projectPath}: absolute user path`);
      windowsUserPath.lastIndex = 0;
      unixUserPath.lastIndex = 0;
      if (machineName.length > 3 && normalized.includes(machineName))
        findings.push(`${relative(root, path)}: local hostname`);
      const emails =
        content.match(/[A-Z0-9._%+-]+@[A-Z][A-Z0-9.-]*\.[A-Z]{2,}/gi) ?? [];
      for (const email of emails)
        if (!email.endsWith("@users.noreply.github.com"))
          findings.push(`${relative(root, path)}: email address`);
      if (
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}/.test(
          content,
        )
      )
        findings.push(`${relative(root, path)}: secret-like value`);
    }
  }
}

await walk(root);
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Privacy and secret-pattern audit passed.");
}
