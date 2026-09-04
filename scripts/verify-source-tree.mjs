import { execFile } from "node:child_process";
import { open, stat } from "node:fs/promises";
import { extname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const safeDirectory = process.cwd().replaceAll("\\", "/");
const { stdout } = await execFileAsync(
  "git",
  ["-c", `safe.directory=${safeDirectory}`, "ls-files", "-z"],
  {
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024,
  },
);
const files = stdout.toString("utf8").split("\0").filter(Boolean);

const releaseExtensions = new Set([
  ".appimage",
  ".deb",
  ".dll",
  ".dmg",
  ".exe",
  ".msi",
  ".pdb",
  ".rpm",
  ".wixpdb",
]);
const outputSegments = new Set(["bundle", "target"]);
const outputPrefixes = ["src-tauri/gen/"];
const releaseNamePattern =
  /(?:webview2runtimeinstaller|openbiofigure.*(?:setup|installer))/i;
const findings = [];

for (const file of files) {
  const normalized = file.replaceAll("\\", "/");
  const segments = normalized.toLowerCase().split("/");
  const extension = extname(normalized).toLowerCase();
  if (segments.some((segment) => outputSegments.has(segment)))
    findings.push(`${normalized}: generated build-output directory`);
  if (
    outputPrefixes.some((prefix) => normalized.toLowerCase().startsWith(prefix))
  )
    findings.push(`${normalized}: generated native metadata`);
  if (releaseExtensions.has(extension))
    findings.push(`${normalized}: release binary extension`);
  if (extension === ".log") findings.push(`${normalized}: local log file`);
  if (segments.at(-1)?.startsWith(".env") && segments.at(-1) !== ".env.example")
    findings.push(`${normalized}: environment file`);
  if (releaseNamePattern.test(normalized))
    findings.push(`${normalized}: generated installer payload`);

  const details = await stat(file);
  if (details.size > 50 * 1024 * 1024)
    findings.push(`${normalized}: tracked file exceeds 50 MiB`);

  if (details.size < 2) continue;
  const handle = await open(file, "r");
  try {
    const header = Buffer.alloc(32);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const bytes = header.subarray(0, bytesRead);
    const signatures = [
      { label: "Windows PE executable", value: Buffer.from([0x4d, 0x5a]) },
      {
        label: "Windows MSI/OLE package",
        value: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      },
      { label: "Microsoft PDB", value: Buffer.from("Microsoft C/C++ MSF") },
    ];
    for (const signature of signatures) {
      if (bytes.subarray(0, signature.value.length).equals(signature.value))
        findings.push(`${normalized}: ${signature.label} signature`);
    }
  } finally {
    await handle.close();
  }
}

if (findings.length) {
  console.error([...new Set(findings)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Source-tree policy passed: ${files.length} tracked files, no local release artifacts.`,
  );
}
