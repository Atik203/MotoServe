import { test, expect } from "@playwright/test";
import { apiAs, firstService } from "../helpers/api";

function dateFromNow(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("owner -> advisor -> mechanic -> payment flow", () => {
  test("vehicle registration through paid invoice", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const advisor = await apiAs(playwright, "advisor");

    // 1. Owner registers a vehicle
    const regNo = `E2E-${Date.now().toString().slice(-6)}`;
    const vehicleRes = await owner.ctx.post("/vehicles", {
      headers: owner.headers,
      data: {
        make: "E2E", model: "Testcar", year: 2024, regNo,
        fuelType: "gasoline", mileage: 1234, color: "Blue", transmission: "Automatic",
      },
    });
    expect(vehicleRes.status(), await vehicleRes.text()).toBe(201);
    const vehicle = (await vehicleRes.json()) as { id: string; regNo: string };
    expect(vehicle.regNo).toBe(regNo);

    const service = await firstService(owner);

    // 2. Owner books an appointment
    const bookingRes = await owner.ctx.post("/appointments", {
      headers: owner.headers,
      data: { vehicleId: vehicle.id, serviceIds: [service.id], date: dateFromNow(10), time: "09:00 AM", notes: "e2e flow" },
    });
    expect(bookingRes.status(), await bookingRes.text()).toBe(201);
    const appointment = (await bookingRes.json()) as { id: string; status: string };
    expect(appointment.status).toBe("pending");

    // 3. Advisor confirms the appointment
    const confirmRes = await advisor.ctx.patch(`/appointments/${appointment.id}`, {
      headers: advisor.headers,
      data: { status: "confirmed" },
    });
    expect(confirmRes.ok()).toBeTruthy();

    // 4. Advisor converts the appointment into a task card
    const taskRes = await advisor.ctx.post("/tasks", {
      headers: advisor.headers,
      data: {
        vehicleId: vehicle.id,
        customerId: owner.user.id,
        appointmentId: appointment.id,
        serviceIds: [service.id],
        issues: "e2e flow intake",
        priority: "urgent",
        station: "Main Bay / Station 01",
        mileage: 1234,
      },
    });
    expect(taskRes.status(), await taskRes.text()).toBe(201);
    const task = (await taskRes.json()) as { id: string };

    // 5. Advisor assigns a mechanic
    const employeesRes = await advisor.ctx.get("/employees", { headers: advisor.headers });
    const employees = (await employeesRes.json()) as { id: string; role: string; status: string }[];
    const mechanic = employees.find((e) => e.role === "mechanic" && e.status === "active");
    expect(mechanic, "expected at least one active mechanic").toBeTruthy();

    const assignRes = await advisor.ctx.post(`/tasks/${task.id}/assign`, {
      headers: advisor.headers,
      data: { mechanicIds: [mechanic!.id], station: "Main Bay / Station 01" },
    });
    expect(assignRes.ok(), await assignRes.text()).toBeTruthy();

    // 6. Advisor sends an estimate
    const estimateRes = await advisor.ctx.post("/estimates", {
      headers: advisor.headers,
      data: {
        taskId: task.id,
        summary: "e2e estimate",
        items: [{ description: "Diagnostics", category: "service", amount: 75 }],
      },
    });
    expect(estimateRes.status(), await estimateRes.text()).toBe(201);
    const estimate = (await estimateRes.json()) as { id: string; status: string };

    // 7. Owner approves the estimate
    const decideRes = await owner.ctx.patch(`/estimates/${estimate.id}/decide`, {
      headers: owner.headers,
      data: { decision: "approved" },
    });
    expect(decideRes.ok(), await decideRes.text()).toBeTruthy();
    expect(((await decideRes.json()) as { status: string }).status).toBe("approved");

    // 8. Work completes, which auto-creates an invoice
    const completeRes = await advisor.ctx.patch(`/tasks/${task.id}/status`, {
      headers: advisor.headers,
      data: { status: "completed" },
    });
    expect(completeRes.ok(), await completeRes.text()).toBeTruthy();

    const invoicesRes = await owner.ctx.get("/invoices", { headers: owner.headers });
    const invoices = (await invoicesRes.json()) as {
      id: string; taskId: string; status: string; total: number; laborTotal: number;
    }[];
    const invoice = invoices.find((i) => i.taskId === task.id);
    expect(invoice, "an invoice should be auto-created when a task is completed").toBeTruthy();
    expect(invoice!.status).toBe("unpaid");
    expect(invoice!.total).toBeGreaterThan(0);

    // 9. Owner pays (cash)
    const payRes = await owner.ctx.post(`/invoices/${invoice!.id}/pay`, {
      headers: owner.headers,
      data: { method: "cash" },
    });
    expect(payRes.ok(), await payRes.text()).toBeTruthy();
    expect(((await payRes.json()) as { status: string }).status).toBe("paid");
  });
});
