import { test, expect } from "@playwright/test";
import { apiAs, firstService, firstVehicle } from "../helpers/api";

function dateFromNow(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("appointment reschedule", () => {
  test("owner can reschedule a booking without changing status", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(owner);

    const created = await owner.ctx.post("/appointments", {
      headers: owner.headers,
      data: {
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        date: dateFromNow(3),
        time: "10:00 AM",
        notes: "initial booking",
      },
    });
    expect(created.status()).toBe(201);
    const appointment = (await created.json()) as { id: string; status: string };
    expect(appointment.status).toBe("pending");

    const newDate = dateFromNow(5);
    const rescheduled = await owner.ctx.patch(`/appointments/${appointment.id}`, {
      headers: owner.headers,
      data: { date: newDate, time: "01:00 PM", notes: "moved a couple of days" },
    });
    expect(
      rescheduled.ok(),
      `owner reschedule should succeed, got ${rescheduled.status()} ${await rescheduled.text()}`,
    ).toBeTruthy();
    const updated = (await rescheduled.json()) as { date: string; time: string; status: string };
    expect(updated.date).toBe(newDate);
    expect(updated.time).toBe("01:00 PM");
    expect(updated.status).toBe("pending");
  });

  test("owner cannot set a non-cancel status", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(owner);

    const created = await owner.ctx.post("/appointments", {
      headers: owner.headers,
      data: { vehicleId: vehicle.id, serviceIds: [service.id], date: dateFromNow(4), time: "02:00 PM" },
    });
    const appointment = (await created.json()) as { id: string };

    const res = await owner.ctx.patch(`/appointments/${appointment.id}`, {
      headers: owner.headers,
      data: { status: "pending" },
    });
    expect(res.status()).toBe(403);
  });

  test("advisor can reschedule and confirm", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(advisor);

    const created = await advisor.ctx.post("/appointments", {
      headers: advisor.headers,
      data: {
        ownerId: owner.user.id,
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        date: dateFromNow(6),
        time: "11:00 AM",
      },
    });
    expect(created.status()).toBe(201);
    const appointment = (await created.json()) as { id: string };

    const rescheduled = await advisor.ctx.patch(`/appointments/${appointment.id}`, {
      headers: advisor.headers,
      data: { date: dateFromNow(7), time: "03:00 PM", notes: "advisor reschedule" },
    });
    expect(rescheduled.ok(), `advisor reschedule failed: ${await rescheduled.text()}`).toBeTruthy();

    const confirmed = await advisor.ctx.patch(`/appointments/${appointment.id}`, {
      headers: advisor.headers,
      data: { status: "confirmed" },
    });
    expect(confirmed.ok()).toBeTruthy();
    const body = (await confirmed.json()) as { status: string };
    expect(body.status).toBe("confirmed");
  });
});
