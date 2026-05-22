import { test, expect } from "@playwright/test";

/** Seed local-only mode: no credentials, app loads directly with banner */
async function seedLocalMode(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("nomad-credentials");
    localStorage.removeItem("nomad-v5");
  });
  await page.reload();
}

test("local mode banner visible on fresh open", async ({ page }) => {
  await seedLocalMode(page);
  await expect(page.locator("text=Local-only mode")).toBeVisible({ timeout: 10000 });
});

test("expense added in local mode persists across reload", async ({ page }) => {
  await seedLocalMode(page);
  await page.click("text=Add");
  await page.fill("input[placeholder='0']", "250");
  await page.click("button:has-text('Add Expense')");
  await expect(page.locator("text=Expense")).toBeVisible({ timeout: 5000 });
  // Reload — data should survive from nomad-v5 localStorage
  await page.reload();
  await page.click("text=History");
  await expect(page.locator("text=250").first()).toBeVisible({ timeout: 5000 });
});

test("banner Setup button opens credential setup", async ({ page }) => {
  await seedLocalMode(page);
  await page.click("button:has-text('Setup')");
  await expect(page.locator("text=Project URL")).toBeVisible({ timeout: 5000 });
  // Cancel returns to app
  await page.click("button:has-text('Cancel')");
  await expect(page.locator("text=Local-only mode")).toBeVisible();
});

test("banner dismiss hides until reload", async ({ page }) => {
  await seedLocalMode(page);
  await expect(page.locator("text=Local-only mode")).toBeVisible();
  await page.click("button[aria-label='Dismiss']").catch(() => {});
  // Fallback — click the ✕ next to banner text
  const dismissBtn = page.locator("text=Local-only mode").locator("..").locator("button", { hasText: "✕" });
  if (await dismissBtn.count() > 0) await dismissBtn.click();
  await expect(page.locator("text=Local-only mode")).toBeHidden({ timeout: 2000 });
});
