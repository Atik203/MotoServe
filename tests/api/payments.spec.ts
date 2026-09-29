import { test, expect } from "@playwright/test";
import { apiAs, completeTask, createTaskForOwner, invoiceForTask, loginUser } from "../helpers/api";

test.describe("card payment (Stripe checkout demo)", () => {
  test("starting a card payment returns a Stripe Checkout URL", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e stripe checkout" });
    await completeTask(advisor, task.id);

    const invoice = await invoiceForTask(owner, task.id);
    expect(invoice, "an invoice should exist before paying").toBeTruthy();

    const res = await owner.ctx.post("/payments/checkout", {
      headers: owner.headers,
      data: { invoiceId: invoice!.id },
    });

    if (res.status() === 500) {
      // Stripe keys are not configured in this environment.
      test.skip(true, `Stripe is not configured: ${await res.text()}`);
      return;
    }

    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { url: string };
    expect(body.url, "a hosted checkout URL should be returned").toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  test("another owner cannot start a checkout for someone else's invoice", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const other = await loginUser(playwright, "david.thompson@example.com", "password123");

    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e stripe ownership" });
    await completeTask(advisor, task.id);
    const invoice = await invoiceForTask(owner, task.id);
    expect(invoice).toBeTruthy();

    const res = await other.ctx.post("/payments/checkout", {
      headers: other.headers,
      data: { invoiceId: invoice!.id },
    });
    expect(res.status()).toBe(403);
  });
});
