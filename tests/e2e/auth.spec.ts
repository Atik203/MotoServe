import { test, expect } from "@playwright/test";

test.describe("login", () => {
  test("owner lands on the owner dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Owner", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(\/|$)/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("advisor lands on the advisor portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Advisor", exact: true }).click();
    await expect(page).toHaveURL(/\/advisor(\/|$)/);
  });
});
