import { expect, test } from "@playwright/test";

test("serves the product homepage at the repository root", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Make scientific figures clear, editable, and attributable.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open app", exact: true }).first(),
  ).toHaveAttribute("href", "./app/");
});

test("serves the editor directly from the app route", async ({ page }) => {
  await page.goto("/app/");
  await expect(
    page.getByRole("button", { name: "New figure", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Editor — OpenBioFigure");
});

test("serves a focused download page with the official installer", async ({
  page,
}) => {
  await page.goto("/download/");
  await expect(
    page.getByRole("heading", { name: "Download for Windows" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download Windows installer" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/Voldigoade/openbiofigure/releases/download/v0.2.1/OpenBioFigure_0.2.1_x64-setup.exe",
  );
});
