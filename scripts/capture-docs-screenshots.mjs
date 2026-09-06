import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.DOCS_SCREENSHOT_BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = path.resolve("docs/public/screenshots");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${baseUrl}/app/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page
    .getByRole("heading", {
      name: "Create an editable scientific figure",
    })
    .waitFor();
  await page.screenshot({ path: path.join(outputDir, "home.png") });

  await page.getByRole("button", { name: "New figure", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ path: path.join(outputDir, "new-figure.png") });
  await page.getByRole("button", { name: "Close dialog" }).click();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await page.screenshot({ path: path.join(outputDir, "settings.png") });

  await page.getByRole("button", { name: /Back to OpenBioFigure/ }).click();
  await page.getByRole("button", { name: /Experimental workflow/ }).click();
  await page.getByTestId("workspace").waitFor();
  await page.screenshot({ path: path.join(outputDir, "editor.png") });
} finally {
  await browser.close();
}
