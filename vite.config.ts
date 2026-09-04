import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

function offlinePrecacheManifest(): Plugin {
  let generatedFiles: string[] = [];
  return {
    name: "openbiofigure-offline-precache",
    generateBundle(_options, bundle) {
      generatedFiles = Object.values(bundle)
        .map((entry) => entry.fileName)
        .filter((fileName) => /\.(?:css|js)$/.test(fileName))
        .sort();
    },
    async writeBundle(options) {
      const outputDirectory = resolve(process.cwd(), options.dir ?? "dist");
      const workerPath = resolve(outputDirectory, "sw.js");
      const template = await readFile(workerPath, "utf8");
      await writeFile(
        workerPath,
        template.replace(
          '["__OPENBIOFIGURE_PRECACHE__"]',
          JSON.stringify(generatedFiles),
        ),
      );
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), offlinePrecacheManifest()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          fabric: ["fabric"],
          react: ["react", "react-dom"],
          validation: ["zod", "dompurify", "idb-keyval"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
