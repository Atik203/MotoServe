import { test, expect } from "@playwright/test";
import { apiAs, customerWithVehicle, firstService, firstVehicle } from "../helpers/api";

function dateFromNow(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("task card creation", () => {
  for (const priority of ["low", "medium", "high", "urgent"] as const) {
    test(`accepts the "${priority}" priority`, async ({ playwright }) => {
      const advisor = await apiAs(playwright, "advisor");
      const { customerId, vehicleId } = await customerWithVehicle(advisor);

      const res = await advisor.ctx.post("/tasks", {
        headers: advisor.headers,
        data: {
          vehicleId,
          customerId,
          issues: `e2e walk-in task (${priority})`,
          priority,
          station: "Main Bay / Station 01",
          mileage: 25000,
          fuelLevel: 50,
          keysReceived: true,
        },
      });
      expect(
        res.status(),
        `priority "${priority}" should be accepted, got ${res.status()} ${await res.text()}`,
      ).toBe(201);
      const { id } = (await res.json()) as { id: string };

      const detail = await advisor.ctx.get(`/tasks/${id}`, { headers: advisor.headers });
      expect(detail.ok()).toBeTruthy();
      const task = (await detail.json()) as { priority: string };
      expect(task.priority).toBe(priority);
    });
  }

  test("rejects an unknown priority with a field-level error", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const { customerId, vehicleId } = await customerWithVehicle(advisor);

    const res = await advisor.ctx.post("/tasks", {
      headers: advisor.headers,
      data: { vehicleId, customerId, issues: "bad priority", priority: "banana" },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error: string; issues?: { path: (string | number)[] }[] };
    expect(body.error).toBe("Validation failed");
    expect(body.issues?.[0]?.path).toContain("priority");
  });

  test("rejects re-intaking an appointment that already has a task card", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const vehicle = await firstVehicle(owner);
    const service = await firstService(advisor);

    const booking = await advisor.ctx.post("/appointments", {
      headers: advisor.headers,
      data: {
        ownerId: owner.user.id,
        vehicleId: vehicle.id,
        serviceIds: [service.id],
        date: dateFromNow(8),
        time: "09:00 AM",
        status: "confirmed",
      },
    });
    expect(booking.status()).toBe(201);
    const appointment = (await booking.json()) as { id: string };

    const payload = {
      vehicleId: vehicle.id,
      customerId: owner.user.id,
      appointmentId: appointment.id,
      issues: "appointment intake",
      priority: "medium",
    };

    const first = await advisor.ctx.post("/tasks", { headers: advisor.headers, data: payload });
    expect(first.status()).toBe(201);

    const second = await advisor.ctx.post("/tasks", { headers: advisor.headers, data: payload });
    expect(second.status()).toBe(409);
    const body = (await second.json()) as { error: string };
    expect(body.error).toContain("already has task card");
  });

  test("rejects an appointment that belongs to a different vehicle", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const service = await firstService(advisor);

    const vehiclesRes = await advisor.ctx.get("/vehicles", { headers: advisor.headers });
    const vehicles = (await vehiclesRes.json()) as { id: string; ownerId: string }[];
    const ownerVehicles = vehicles.filter((v) => v.ownerId === owner.user.id);
    test.skip(ownerVehicles.length < 2, "needs an owner with at least two vehicles");

    const booking = await advisor.ctx.post("/appointments", {
      headers: advisor.headers,
      data: {
        ownerId: owner.user.id,
        vehicleId: ownerVehicles[0].id,
        serviceIds: [service.id],
        date: dateFromNow(9),
        time: "09:00 AM",
      },
    });
    const appointment = (await booking.json()) as { id: string };

    const res = await advisor.ctx.post("/tasks", {
      headers: advisor.headers,
      data: {
        vehicleId: ownerVehicles[1].id,
        customerId: owner.user.id,
        appointmentId: appointment.id,
        issues: "mismatched vehicle",
      },
    });
    expect(res.status()).toBe(400);
  });
});
