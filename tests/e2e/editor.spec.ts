import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") {
      const source = message.location().url;
      errors.push(`console: ${message.text()}${source ? ` (${source})` : ""}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
});

test.afterEach(({ page }) => {
  expect(browserErrors.get(page) ?? [], "browser runtime errors").toEqual([]);
});

async function openEditor(page: Page) {
  await page.goto("/");
  const newFigure = page.getByRole("button", {
    name: "New figure",
    exact: true,
  });
  await expect(newFigure.or(page.getByTestId("workspace"))).toBeVisible();
  if (await newFigure.isVisible()) {
    await newFigure.click();
    await page.getByRole("button", { name: "Create figure" }).click();
  }
  await expect(page.getByTestId("workspace")).toBeVisible();
  await expect(page.getByText("Saved locally")).toBeVisible({
    timeout: 10_000,
  });
}

test("first run presents clear local-first start actions", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Create an editable scientific figure" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New figure", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open project" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Figure templates" }),
  ).toBeVisible();
  await expect(page.getByText("No recent projects yet")).toBeVisible();
});

test("persists theme, density, and reduced-motion preferences", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("button", { name: "Dark" }).click();
  await page.getByRole("button", { name: "Compact" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");

  await page.getByRole("button", { name: "Accessibility" }).click();
  await page.getByLabel("Reduce interface motion").check();
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduce-motion",
    "true",
  );

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduce-motion",
    "true",
  );
});

test("creates a figure from the New figure template flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New figure", exact: true }).click();
  await page.getByRole("tab", { name: /Use a template/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Comparison A\/B/ })
    .click();
  await page.getByRole("button", { name: "Use template" }).click();

  await expect(page.getByTestId("workspace")).toBeVisible();
  await expect(page.locator(".title-field input")).toHaveValue(
    "Comparison A/B",
  );
  expect(await layerCount(page)).toBeGreaterThan(4);
});

test("starts from a structured, editable scientific template", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Experimental workflow/ }).click();
  await expect(page.getByTestId("workspace")).toBeVisible();
  expect(await layerCount(page)).toBeGreaterThan(10);
  await expect(page.locator(".title-field input")).toHaveValue(
    "Experimental workflow",
  );
});

test("returns to a recent local project from Home", async ({ page }) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  await expect(page.getByText("Saved locally")).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByRole("button", { name: /OpenBioFigure/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Recent projects" }),
  ).toBeVisible();
  const recentList = page.locator(".recent-list");
  await expect(
    recentList.getByText("1 object", { exact: false }),
  ).toBeVisible();
  await recentList.getByRole("button", { name: /^Untitled figure/ }).click();
  await expect(page.getByTestId("workspace")).toBeVisible();
  expect(await layerCount(page)).toBe(1);
});

async function layerCount(page: Page) {
  await page.getByRole("tab", { name: /Layers/ }).click();
  return page.locator(".layer-row").count();
}

async function addMitochondrion(page: Page) {
  await page.getByLabel("Search scientific assets").fill("mitochondria");
  await page
    .getByRole("button", { name: "Add to canvas: Mitochondrion" })
    .click();
  await expect(page.getByText("Provenance complete")).toBeVisible();
}

test("create a document, add core objects, and save a project file", async ({
  page,
}) => {
  await openEditor(page);
  await page.getByRole("button", { name: "New document" }).click();
  await page.getByRole("button", { name: /Square 1080/ }).click();
  await page.getByRole("button", { name: "Create figure" }).click();
  await page.getByTestId("add-rectangle").click();
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByRole("button", { name: "Add arrow" }).click();
  await page.getByRole("button", { name: "Add connector" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save-project").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("untitled-figure.obf.json");
  const path = await download.path();
  expect(path).not.toBeNull();
  const project = JSON.parse(await readFile(path, "utf8")) as {
    formatVersion: string;
    objects: { kind: string }[];
    document: { width: number };
  };
  expect(project).toMatchObject({
    formatVersion: "1.0.0",
    document: { width: 1080 },
  });
  expect(project.objects.map((object) => object.kind)).toEqual(
    expect.arrayContaining(["rect", "text", "arrow", "connector"]),
  );
  expect(project.objects).toHaveLength(4);
});

test("search an asset, add it, and inspect provenance", async ({ page }) => {
  await openEditor(page);
  await addMitochondrion(page);
  await expect(
    page.getByText("Servier Medical Art", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("publication-check")
      .getByText("CC-BY-3.0", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Original source" }),
  ).toHaveAttribute("href", /bioicons/);
});

test("keeps favorite and recent scientific assets available locally", async ({
  page,
}) => {
  await openEditor(page);
  await page.getByLabel("Search scientific assets").fill("mitochondria");
  await page
    .getByRole("button", { name: "Favorite asset: Mitochondrion" })
    .click();
  await page
    .locator(".asset-scopes")
    .getByRole("button", { name: "Favorites" })
    .click();
  await expect(
    page.getByRole("button", { name: "Add to canvas: Mitochondrion" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to canvas: Mitochondrion" })
    .click();
  await page
    .locator(".asset-scopes")
    .getByRole("button", { name: "Recent" })
    .click();
  await expect(
    page.getByRole("button", { name: "Add to canvas: Mitochondrion" }),
  ).toBeVisible();
});

test("adds editable scientific motifs, panels, and precise dimensions", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("details.science-tools summary").click();
  await page.getByTestId("add-scientific-cell").click();
  await expect(page.getByLabel("Layer name")).toHaveValue("Editable cell");
  await page.getByLabel("W", { exact: true }).fill("320");
  await expect(page.getByLabel("W", { exact: true })).toHaveValue("320");
  await page.keyboard.press("Shift+ArrowRight");
  await page.getByTestId("add-scientific-panel").click();
  expect(await layerCount(page)).toBe(2);
});

test("creates an editable chart and exports a publication report", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("details.science-tools summary").click();
  await page.getByTestId("create-chart").click();
  await page.getByRole("button", { name: "Line chart" }).click();
  await page.getByRole("button", { name: "Create chart" }).click();
  await expect(page.getByLabel("Layer name")).toHaveValue("Line chart");
  await page.getByRole("tab", { name: /License/ }).click();
  await expect(page.getByText("Figure preflight")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Publication report" }).click();
  const report = await downloadPromise;
  expect(await readFile(await report.path(), "utf8")).toContain(
    "Preflight: ready",
  );
});

test("undo and redo an editor change", async ({ page }) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  await page.getByRole("button", { name: "Add ellipse" }).click();
  expect(await layerCount(page)).toBe(2);
  await page.getByTestId("undo").click();
  expect(await layerCount(page)).toBe(1);
  await page.getByTestId("redo").click();
  expect(await layerCount(page)).toBe(2);
});

test("exports editable SVG with project metadata", async ({ page }) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-svg").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("untitled-figure.svg");
  const path = await download.path();
  const svg = await readFile(path, "utf8");
  expect(svg).toContain("<svg");
  expect(svg).toContain("openbiofigure-metadata");
  expect(svg).toContain("<rect");
});

test("exports a real PNG at a configured scale", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Add ellipse" }).click();
  await page.getByLabel("PNG export scale").selectOption("3");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-png").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("untitled-figure@3x.png");
  const path = await download.path();
  const png = await readFile(path);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.length).toBeGreaterThan(1_000);
});

test("autosaves across reload and reopens an exported project", async ({
  page,
}) => {
  await openEditor(page);
  await page.getByTestId("add-text").click();
  await expect(page.getByText("Saved locally")).toBeVisible({
    timeout: 10_000,
  });
  await page.reload();
  await expect(page.getByTestId("workspace")).toBeVisible();
  expect(await layerCount(page)).toBe(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save-project").click();
  const projectDownload = await downloadPromise;
  const projectPath = await projectDownload.path();
  await page.getByRole("button", { name: "New document" }).click();
  await page.getByRole("button", { name: "Create figure" }).click();
  expect(await layerCount(page)).toBe(0);
  await page
    .locator('input[type="file"][accept*="application/json"]')
    .setInputFiles(projectPath);
  await expect(page.getByText("Project opened")).toBeVisible();
  expect(await layerCount(page)).toBe(1);
});

test("publication check and attribution generator use placed assets", async ({
  page,
}) => {
  await openEditor(page);
  await addMitochondrion(page);
  await expect(page.getByTestId("publication-check")).toContainText(
    "1 of 1 used assets have complete provenance",
  );
  await expect(page.getByTestId("publication-check")).toContainText(
    "does not provide legal advice",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "ATTRIBUTIONS.md" }).click();
  const download = await downloadPromise;
  expect(await readFile(await download.path(), "utf8")).toContain(
    "Mitochondrion by Servier Medical Art",
  );
});

test("keyboard basics duplicate, copy, paste, delete, and undo", async ({
  page,
}) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  await page.keyboard.press("Control+d");
  expect(await layerCount(page)).toBe(2);
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Control+v");
  expect(await layerCount(page)).toBe(3);
  await page.keyboard.press("Delete");
  expect(await layerCount(page)).toBe(2);
  await page.keyboard.press("Control+z");
  expect(await layerCount(page)).toBe(3);
});

test("multi-selects, groups, and ungroups canvas objects", async ({ page }) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  await page.getByLabel("X", { exact: true }).fill("400");
  await page.getByRole("button", { name: "Add ellipse" }).click();
  const canvas = await page.locator(".upper-canvas").boundingBox();
  if (!canvas) throw new Error("Editable canvas is not visible.");
  const scale = canvas.width / 1200;
  await page.mouse.move(canvas.x + 300 * scale, canvas.y + 300 * scale);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 700 * scale, canvas.y + 500 * scale, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Group selection", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Group selection", exact: true })
    .click();
  expect(await layerCount(page)).toBe(1);
  await expect(
    page.getByRole("button", { name: "Ungroup selection", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Ungroup selection", exact: true })
    .click();
  expect(await layerCount(page)).toBe(2);
});

test("keeps the editor responsive with 100 vector objects", async ({
  page,
}) => {
  await openEditor(page);
  const started = Date.now();
  await page.getByTestId("add-rectangle").evaluate((button) => {
    for (let index = 0; index < 100; index += 1)
      (button as HTMLButtonElement).click();
  });
  await expect(page.getByText("Saved locally")).toBeVisible({
    timeout: 15_000,
  });
  expect(await layerCount(page)).toBe(100);
  expect(Date.now() - started).toBeLessThan(15_000);
});

test("sanitizes a local SVG and flags unknown provenance", async ({ page }) => {
  await openEditor(page);
  await page.locator('input[type="file"][accept*=".svg"]').setInputFiles({
    name: "untrusted.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="40" height="20" fill="#087f8c"/></svg>',
    ),
  });
  await expect(
    page.getByText("Potentially active SVG content was removed before import."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import SVG" }).click();
  await expect(page.getByText("Review required")).toBeVisible();
  await expect(page.getByTestId("publication-check")).toContainText(
    "incomplete provenance or unknown licensing",
  );
  expect(await layerCount(page)).toBe(1);
});

test("layers expose keyboard-operable visibility and locking", async ({
  page,
}) => {
  await openEditor(page);
  await page.getByTestId("add-rectangle").click();
  await page.getByRole("tab", { name: /Layers/ }).click();
  await page.getByRole("button", { name: "Hide Rectangle" }).click();
  await expect(
    page.getByRole("button", { name: "Show Rectangle" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lock Rectangle" }).click();
  await expect(
    page.getByRole("button", { name: "Unlock Rectangle" }),
  ).toBeVisible();
});

test("adapts to tablet and gives clear mobile guidance", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await openEditor(page);
  await expect(page.getByTestId("workspace")).toBeVisible();
  await expect(page.locator(".right-panel")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "OpenBioFigure" }),
  ).toBeVisible();
  await expect(
    page.getByText("The editor needs a wider screen."),
  ).toBeVisible();
  await expect(page.getByTestId("workspace")).toBeHidden();
});

test("keeps the core local workflow available offline", async ({
  page,
  context,
}) => {
  await openEditor(page);
  const registrationState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register("./sw.js");
    await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    return {
      active: registration.active?.state ?? null,
      installing: registration.installing?.state ?? null,
      waiting: registration.waiting?.state ?? null,
      caches: await window.caches.keys(),
    };
  });
  expect(registrationState.active, JSON.stringify(registrationState)).toBe(
    "activated",
  );
  expect(
    registrationState.caches,
    JSON.stringify(registrationState),
  ).toHaveLength(1);
  const cacheName = registrationState.caches[0]!;
  expect(cacheName).toMatch(/^openbiofigure-[a-f0-9]{16}$/);
  await page.reload();
  await expect(page.getByTestId("workspace")).toBeVisible();
  const offlineState = await page.evaluate(
    async (currentCacheName) => ({
      controller: navigator.serviceWorker.controller?.scriptURL ?? null,
      entries: (await (await window.caches.open(currentCacheName)).keys()).map(
        (request) => request.url,
      ),
    }),
    cacheName,
  );
  expect(offlineState, JSON.stringify(offlineState)).toMatchObject({
    controller: expect.stringContaining("/sw.js"),
  });
  await context.setOffline(true);
  const cacheProbe = await page.evaluate(async (urls) => {
    const results = await Promise.allSettled(
      urls.map(async (url) => (await fetch(url)).status),
    );
    return results.map((result, index) => ({
      url: urls[index],
      status: result.status === "fulfilled" ? result.value : "failed",
    }));
  }, offlineState.entries);
  expect(cacheProbe, JSON.stringify(cacheProbe)).not.toContainEqual(
    expect.objectContaining({ status: "failed" }),
  );
  await page.goto("/");
  await expect(page.getByTestId("workspace")).toBeVisible();
  await page.getByLabel("Search scientific assets").fill("mitochondria");
  await expect(
    page.getByRole("button", { name: "Add to canvas: Mitochondrion" }),
  ).toBeVisible();
  await page.getByTestId("add-rectangle").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-svg").click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "untitled-figure.svg",
  );
});
