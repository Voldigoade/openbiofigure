import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(({ page }) => {
  expect(browserErrors.get(page) ?? [], "browser runtime errors").toEqual([]);
});

test("serves the documentation home and deep user guides from the Pages base", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", {
      name: /OpenBioFigure Docs Create your first scientific figure/,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/openbiofigure\/docs\/$/);

  await page.goto("./getting-started/first-figure");
  await expect(
    page.getByRole("heading", { name: "Your first figure" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Editor basics" })).toBeVisible();
});

test("finds real documentation with the client-side search index", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Search documentation/i }).click();
  const search = page.getByRole("searchbox");
  await search.fill("licensing attribution");
  await expect(
    page.getByRole("link", { name: /Licensing and attribution/i }).first(),
  ).toBeVisible();
});

test("supports dark theme and mobile navigation", async ({ page }) => {
  await page.goto("./projects/exporting");
  await page.getByRole("switch", { name: /Switch to dark theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole("button", { name: /mobile navigation/i }).click();
  await expect(page.getByRole("link", { name: "User guide" })).toBeVisible();
});
