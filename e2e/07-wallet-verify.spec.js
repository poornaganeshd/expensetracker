import { test, expect } from "@playwright/test";
import { gotoLocal, funded, makeExpense } from "./helpers.js";

// Seed one expense so the empty-dashboard welcome card is suppressed (it renders
// its own "Settings" button that collides under strict mode) and fund the
// wallets so the cards show real balances. Bank = 100000 − 250 expense = 99750.
const seeded = { ...funded(100000), expenses: [makeExpense({ amount: 250, walletId: "bank" })] };

// Open the Reconcile drawer for the Bank wallet card on the dashboard.
async function openReconcile(page) {
  await gotoLocal(page, seeded);
  await page.getByText("Bank", { exact: true }).click();
  await expect(page.getByText("Reconcile Bank", { exact: false })).toBeVisible();
}

test("verify path: matching balance confirms in-sync without logging an adjustment", async ({ page }) => {
  await openReconcile(page);

  // Drawer opens pre-filled with NOMAD's balance → gap 0 → Verify affordance.
  await expect(page.getByText("Matches NOMAD balance", { exact: false })).toBeVisible();
  const verifyBtn = page.getByRole("button", { name: /Verify/ });
  await expect(verifyBtn).toBeVisible();

  await verifyBtn.click();

  // Success toast, and — crucially — NO calibration entry written (a zero-gap
  // log is what used to stamp the misleading ⚖ adjustment badge / "false view").
  await expect(page.getByText(/verified — balance in sync/)).toBeVisible();
  const calLog = await page.evaluate(() => localStorage.getItem("nomad-cal-log"));
  expect(calLog == null || JSON.parse(calLog).length === 0).toBe(true);
});

test("reconcile path: a different balance logs an adjustment", async ({ page }) => {
  await openReconcile(page);

  // Type a real balance that differs from NOMAD → gap ≠ 0 → reconcile.
  await page.locator('input[type="number"]').first().fill("50000");
  const setBtn = page.getByRole("button", { name: "Set Balance", exact: true });
  await expect(setBtn).toBeVisible();

  await setBtn.click();

  await expect(page.getByText(/reconciliation logged/)).toBeVisible();
  await expect.poll(async () =>
    page.evaluate(() => { try { return JSON.parse(localStorage.getItem("nomad-cal-log") || "[]").length; } catch { return 0; } })
  ).toBe(1);
});
