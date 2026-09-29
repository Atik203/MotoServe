import { test, expect } from "@playwright/test";

function dateFromNow(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("owner appointments", () => {
  test("owner can reschedule an appointment from the list", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Owner", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(\/|$)/);

    await page.goto("/dashboard/appointments");

    const rescheduleButtons = page.locator('[title="Reschedule Appointment"]');
    await expect(rescheduleButtons.first()).toBeVisible();
    await rescheduleButtons.first().click();

    const dialog = page.getByRole("dialog", { name: "Reschedule Appointment" });
    await expect(dialog).toBeVisible();

    const newDate = dateFromNow(21);
    await dialog.locator('input[type="date"]').fill(newDate);
    await dialog.getByRole("button", { name: "Confirm Reschedule" }).click();

    await expect(page.getByText("Appointment rescheduled successfully")).toBeVisible();
  });
});
