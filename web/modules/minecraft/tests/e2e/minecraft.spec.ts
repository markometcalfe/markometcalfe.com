import { takeSnapshot } from "@chromatic-com/playwright";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/minecraft");
});

test.describe("MinecraftPage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await expect(page.locator('text="Server IP:"')).toBeVisible();
    await expect(
      page.locator('text="minecraft.markometcalfe.com"'),
    ).toBeVisible();
    await takeSnapshot(page, "Minecraft Page", testInfo);
  });
});
