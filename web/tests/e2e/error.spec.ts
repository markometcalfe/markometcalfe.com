import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/error");
});

test.describe("ErrorPage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await expect(page.locator('text="Error"')).toBeVisible();
    await expect(
      page.locator('text="Something has gone wrong 🤯"'),
    ).toBeVisible();
    await takeSnapshot(page, "Error Page", testInfo);
  });

  test("contact link has correct email", async ({ page }) => {
    const link = page.locator('a:has-text("Contact Me")');
    await expect(link).toHaveAttribute(
      "href",
      "mailto:marko@markometcalfe.com",
    );
  });
});
