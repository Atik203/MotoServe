import { test, expect } from "@playwright/test";
import { apiAs, completeTask, createTaskForOwner } from "../helpers/api";

const FAKE_CHECKOUT_URL = "https://checkout.stripe.com/c/pay/e2e_demo_session";

test.describe("card payment demo", () => {
  test("clicking Pay Now hands off to the Stripe Checkout page", async ({ page, playwright }) => {
    // Ensure the owner has an unpaid invoice.
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e pay now" });
    await completeTask(advisor, task.id);

    // Stub the Stripe handoff so the demo flow can be verified without a real payment.
    await page.route("**/api/payments/checkout", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: FAKE_CHECKOUT_URL }),
      }),
    );
    await page.route("https://checkout.stripe.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Stripe Checkout</body></html>" }),
    );

    await page.goto("/login");
    await page.getByRole("button", { name: "Owner", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(\/|$)/);

    await page.goto("/dashboard/payments");

    const payNow = page.getByRole("button", { name: "Pay Now" }).first();
    await expect(payNow).toBeVisible();
    await payNow.click();

    const proceed = page.getByRole("button", { name: /Proceed to Stripe Checkout/ });
    await expect(proceed).toBeVisible();
    await proceed.click();

    await expect(page).toHaveURL(new RegExp(`^${FAKE_CHECKOUT_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });
});
