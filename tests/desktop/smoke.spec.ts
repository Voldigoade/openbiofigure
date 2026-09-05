import { $, browser, expect } from "@wdio/globals";

describe("OpenBioFigure desktop", () => {
  it("renders Home and opens a new figure in the packaged Tauri app", async () => {
    // The release app has one window. Marking that window as explicit avoids
    // @wdio/tauri-service querying its optional embedded plugin before every
    // locator operation when the external tauri-driver provider is used.
    const mainWindow = await browser.getWindowHandle();
    await browser.switchToWindow(mainWindow);

    const homeHeading = $("aria/Create an editable scientific figure");
    await homeHeading.waitForDisplayed();
    await expect(homeHeading).toBeDisplayed();

    const newFigure = $("aria/New figure");
    await expect(newFigure).toBeDisplayed();
    await newFigure.click();

    const createFigure = $("aria/Create figure");
    await createFigure.waitForDisplayed();
    await createFigure.click();

    const workspace = $('[data-testid="workspace"]');
    await workspace.waitForDisplayed();
    await expect(workspace).toBeDisplayed();

    expect(await browser.getUrl()).toContain("desktop-recovery=0.2.1");

    const assetSearch = $("aria/Search scientific assets");
    await assetSearch.waitForDisplayed();
    await assetSearch.setValue("mitochondria");

    const addMitochondrion = $('[aria-label="Add to canvas: Mitochondrion"]');
    await addMitochondrion.waitForDisplayed();
    await addMitochondrion.click();

    const provenance = $("//*[contains(., 'Provenance complete')]");
    await provenance.waitForDisplayed();
  });
});
