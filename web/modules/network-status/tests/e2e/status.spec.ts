import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";

test.describe("NetworkStatusPage", () => {
  test("can navigate back home", async ({ page }) => {
    await page.goto("/status");
    const link = page.locator('[aria-label="Back"]');

    await Promise.all([page.waitForURL("/"), link.click()]);
    await expect(page.locator("body")).toContainText(
      "Marko Metcalfe",
    );
  });

  test("can see connected network status", async ({
    page,
  }, testInfo) => {
    await page.setExtraHTTPHeaders({
      "CF-Connecting-IP": "123.45.678.90",
    });
    await page.goto("/status");
    await expect(
      page.locator('text="Connection Status"'),
    ).toBeVisible();
    await expect(page.locator(".networkstatus")).toContainText(
      "Connected To Local Network",
    );
    await expect(page.locator(".networkstatus")).not.toContainText(
      "Not Connected To Local Network",
    );
    await expect(page.locator(".networkstatus")).toContainText(
      "Your IP: 123.45.678.90",
    );
    await expect(page.locator(".networkstatus")).toContainText(
      "Home IP: 123.45.678.90",
    );
    await takeSnapshot(
      page,
      "Network Status Page - Connected",
      testInfo,
    );
  });

  test("can see not connected network status", async ({
    page,
  }, testInfo) => {
    await page.setExtraHTTPHeaders({ "CF-Connecting-IP": "1.2.3.4" });
    await page.goto("/status");
    await expect(
      page.locator('text="Connection Status"'),
    ).toBeVisible();
    await expect(page.locator(".networkstatus")).toContainText(
      "Not Connected To Local Network",
    );
    await takeSnapshot(
      page,
      "Network Status Page - Not Connected",
      testInfo,
    );
  });

  test("can refresh the network status", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "CF-Connecting-IP": "1.2.3.4" });
    await page.goto("/status");
    await expect(
      page.locator('text="Connection Status"'),
    ).toBeVisible();
    await expect(page.locator(".networkstatus")).toContainText(
      "Not Connected To Local Network",
    );

    await page.setExtraHTTPHeaders({
      "CF-Connecting-IP": "123.45.678.90",
    });
    const refreshButton = page.getByTitle("Refresh");
    await refreshButton.click();
    await expect(page.locator(".networkstatus")).toContainText(
      "Connected To Local Network",
    );
    await expect(page.locator(".networkstatus")).toContainText(
      "Your IP: 123.45.678.90",
    );
    await expect(page.locator(".networkstatus")).toContainText(
      "Home IP: 123.45.678.90",
    );
  });
});
