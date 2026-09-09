import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/sequencer");
});

test.describe("SequencerPage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await expect(page.locator('text="Step Sequencer"')).toBeVisible();
    await expect(
      page.locator(".sequencerpage-sequences"),
    ).toBeVisible();
    await takeSnapshot(page, "Sequencer Page", testInfo);
  });

  test("can navigate back home", async ({ page }) => {
    const link = page.locator('[aria-label="Back"]');

    await Promise.all([page.waitForURL("/"), link.click()]);

    await expect(page.locator("body")).toContainText(
      "Marko Metcalfe",
    );
  });
});
