import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/resume");
});

test.describe("ResumePage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await expect(page.locator('text="Experience"')).toBeVisible();
    await expect(page.locator('text="Skills"')).toBeVisible();
    await expect(page.locator('text="Education"')).toBeVisible();

    await takeSnapshot(page, "Resume Page", testInfo);
  });

  test("can navigate back home", async ({ page }) => {
    const link = page.locator('[aria-label="Back"]');

    await Promise.all([page.waitForURL("/"), link.click()]);

    await expect(page.locator("body")).toContainText(
      "Marko Metcalfe",
    );
  });

  test("download button has correct link", async ({ page }) => {
    const link = page.locator('a:has-text("PDF")');

    await expect(link).toHaveAttribute(
      "href",
      "https://markometcalfe.com/resume.pdf",
    );
    await expect(link).toHaveAttribute("title", "Download as a PDF");
  });
});
