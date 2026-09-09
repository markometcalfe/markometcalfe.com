import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/visuals");
});

test.describe("VisualsPage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await expect(page.locator('text="Visualiser"')).toBeVisible();
    await takeSnapshot(page, "Visuals Page", testInfo);
  });

  test("can navigate back home", async ({ page }) => {
    const link = page.locator('[aria-label="Back"]');

    await Promise.all([page.waitForURL("/"), link.click()]);

    await expect(page.locator("body")).toContainText(
      "Marko Metcalfe",
    );
  });

  test("can navigate to the edit shapes page", async ({ page }) => {
    const link = page.locator('a:has-text("Edit Shapes")');

    await Promise.all([
      page.waitForURL("/visuals/shapes"),
      link.click(),
    ]);

    await expect(page.locator("body")).toContainText("Edit Shapes");
  });
});
