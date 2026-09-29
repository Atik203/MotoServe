import { test, expect } from "@playwright/test";
import { apiAs, firstService, firstVehicle } from "../helpers/api";

function dateFromNow(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("advisor vehicle intake", () => {
  test("intake with urgent priority creates a task card", async ({ page, playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const advisor = await apiAs(playwright, "advisor");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(advisor);

    const booking = await advisor.ctx.post("/appointments", {
      headers: advisor.headers,
      data: {
        ownerId: owner.user.id,
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        date: dateFromNow(14),
        time: "09:00 AM",
        notes: "e2e urgent intake",
        status: "confirmed",
      },
    });
    expect(booking.status()).toBe(201);
    const appointment = (await booking.json()) as { id: string };

    await page.goto("/login");
    await page.getByRole("button", { name: "Advisor", exact: true }).click();
    await expect(page).toHaveURL(/\/advisor(\/|$)/);

    await page.goto(`/advisor/receive?appointment=${appointment.id}`);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("intake-priority").selectOption("urgent");
    await dialog.getByTestId("intake-submit").click();

    await expect(page.getByText(/Vehicle checked in! Task Card/)).toBeVisible();

    const tasksRes = await advisor.ctx.get("/tasks", { headers: advisor.headers });
    const tasks = (await tasksRes.json()) as { id: string; appointmentId: string | null; priority: string }[];
    const created = tasks.find((t) => t.appointmentId === appointment.id);
    expect(created, "a task card should exist for the appointment").toBeTruthy();
    expect(created!.priority).toBe("urgent");
  });

  test("re-intaking a converted appointment shows a clear error", async ({ page, playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const advisor = await apiAs(playwright, "advisor");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(advisor);

    const booking = await advisor.ctx.post("/appointments", {
      headers: advisor.headers,
      data: {
        ownerId: owner.user.id,
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        date: dateFromNow(15),
        time: "09:00 AM",
        status: "confirmed",
      },
    });
    const appointment = (await booking.json()) as { id: string };

    const taskRes = await advisor.ctx.post("/tasks", {
      headers: advisor.headers,
      data: {
        vehicleId: vehicle.id,
        customerId: owner.user.id,
        appointmentId: appointment.id,
        issues: "already converted",
      },
    });
    expect(taskRes.status()).toBe(201);

    await page.goto("/login");
    await page.getByRole("button", { name: "Advisor", exact: true }).click();
    await expect(page).toHaveURL(/\/advisor(\/|$)/);

    await page.goto(`/advisor/receive?appointment=${appointment.id}`);

    await expect(page.getByText(/already has task card/)).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
