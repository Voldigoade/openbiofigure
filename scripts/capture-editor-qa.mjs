import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.EDITOR_QA_BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = path.resolve("test-results/editor-visual-qa");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${baseUrl}/app/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /Experimental workflow/ }).click();
  await page.getByTestId("workspace").waitFor();
  await page.locator(".asset-card").first().waitFor();
  await page.screenshot({ path: path.join(outputDir, "editor-overview.png") });

  await page
    .locator("canvas.upper-canvas")
    .click({ position: { x: 120, y: 200 } });
  await page.getByRole("heading", { name: "Selection" }).waitFor();
  await page.screenshot({ path: path.join(outputDir, "editor-inspector.png") });

  await page.getByRole("tab", { name: /Layers/ }).click();
  await page.getByText("Front to back").waitFor();
  await page.screenshot({ path: path.join(outputDir, "editor-layers.png") });

  await page.getByRole("tab", { name: /License/ }).click();
  await page.getByText("Publication check").waitFor();
  await page.screenshot({
    path: path.join(outputDir, "editor-publication.png"),
  });

  await page.evaluate(() => {
    globalThis.document.documentElement.dataset.theme = "dark";
  });
  await page.screenshot({ path: path.join(outputDir, "editor-dark.png") });

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole("tab", { name: /Style/ }).click();
  await page.screenshot({ path: path.join(outputDir, "editor-tablet.png") });
} finally {
  await browser.close();
}
