import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.describe("HomePage", () => {
  test("can load page", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator('text="Marko Metcalfe"')).toBeVisible();

    await expect(page.locator('text="Me"')).toBeVisible();
    await expect(page.locator('text="My Work"')).toBeVisible();

    await takeSnapshot(page, "Home Page", testInfo);
  });

  test("email link has valid mailto value", async ({ page }) => {
    await page.goto("/");

    const link = page.getByTitle("Email");

    await expect(link).toHaveAttribute(
      "href",
      "mailto:marko@markometcalfe.com",
    );
  });

  test("can navigate to github", async ({ page }) => {
    await page.goto("/");

    const link = page.getByTitle("GitHub");

    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/markometcalfe",
    );
  });

  test("can navigate to instagram", async ({ page }) => {
    await page.goto("/");

    const link = page.getByTitle("Instagram");

    await expect(link).toHaveAttribute(
      "href",
      "https://instagram.com/markus_vizshun",
    );
  });

  test("can navigate to linkedin", async ({ page }) => {
    await page.goto("/");

    const link = page.getByTitle("LinkedIn");

    await expect(link).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/marko-metcalfe/",
    );
  });

  test("can navigate to the resume page", async ({ page }) => {
    await page.goto("/");

    const link = page.locator('a:has-text("Resume")');

    await Promise.all([page.waitForURL("/resume"), link.click()]);

    await expect(page.locator("body")).toContainText("Resume");
    await expect(page.locator("body")).toContainText("Experience");
  });

  test("can navigate to the visuals page", async ({ page }) => {
    await page.goto("/");

    const link = page.locator('a:has-text("Visualiser")');

    await Promise.all([page.waitForURL("/visuals"), link.click()]);

    await expect(page.locator("body")).toContainText("Visualiser");
  });

  test("can navigate to the sequencer page", async ({ page }) => {
    await page.goto("/");

    const link = page.locator('a:has-text("Sequencer")');

    await Promise.all([page.waitForURL("/sequencer"), link.click()]);

    await expect(page.locator("body")).toContainText(
      "Step Sequencer",
    );
  });

  test("can navigate to the games page", async ({ page }) => {
    await page.goto("/");

    const link = page.locator('a:has-text("Games")');

    await Promise.all([page.waitForURL(/\/play\/.+/), link.click()]);

    await expect(page.locator("body")).toContainText("Games");
  });
});
