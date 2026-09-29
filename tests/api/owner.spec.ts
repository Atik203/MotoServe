import { test, expect } from "@playwright/test";
import { advanceTask, apiAs, completeTask, createTaskForOwner, invoiceForTask, loginUser } from "../helpers/api";

test.describe("vehicle owner", () => {
  test("registers a vehicle with model and registration number", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const regNo = `E2E-${Date.now().toString().slice(-6)}`;

    const res = await owner.ctx.post("/vehicles", {
      headers: owner.headers,
      data: { make: "Honda", model: "Civic", year: 2025, regNo, fuelType: "hybrid", mileage: 120, color: "Silver" },
    });
    expect(res.status(), await res.text()).toBe(201);
    const vehicle = (await res.json()) as { id: string; regNo: string; fuelType: string };
    expect(vehicle.regNo).toBe(regNo);
    expect(vehicle.fuelType).toBe("hybrid");

    const list = (await (await owner.ctx.get("/vehicles", { headers: owner.headers })).json()) as { id: string }[];
    expect(list.some((v) => v.id === vehicle.id)).toBe(true);

    const updated = await owner.ctx.patch(`/vehicles/${vehicle.id}`, {
      headers: owner.headers,
      data: { mileage: 500 },
    });
    expect(updated.ok(), await updated.text()).toBeTruthy();

    const removed = await owner.ctx.delete(`/vehicles/${vehicle.id}`, { headers: owner.headers });
    expect(removed.ok()).toBeTruthy();
  });

  test("rejects an extra repair cost estimate", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");

    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e estimate rejection" });
    const estimateRes = await advisor.ctx.post("/estimates", {
      headers: advisor.headers,
      data: {
        taskId: task.id,
        summary: "e2e estimate",
        items: [{ description: "Extra repair", category: "labor", amount: 120 }],
      },
    });
    expect(estimateRes.status(), await estimateRes.text()).toBe(201);
    const estimate = (await estimateRes.json()) as { id: string; status: string };
    expect(estimate.status).toBe("pending");

    const rejected = await owner.ctx.patch(`/estimates/${estimate.id}/decide`, {
      headers: owner.headers,
      data: { decision: "rejected" },
    });
    expect(rejected.ok(), await rejected.text()).toBeTruthy();
    expect(((await rejected.json()) as { status: string }).status).toBe("rejected");

    const list = (await (await owner.ctx.get("/estimates", { headers: owner.headers })).json()) as {
      id: string;
      status: string;
    }[];
    expect(list.find((e) => e.id === estimate.id)?.status).toBe("rejected");
  });

  test("rates a completed service and can remove the rating", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e rating" });

    const tooEarly = await owner.ctx.post(`/tasks/${task.id}/rate`, {
      headers: owner.headers,
      data: { score: 5, review: "too early", serviceName: "Oil Change" },
    });
    expect(tooEarly.status()).toBe(409);

    await completeTask(advisor, task.id);

    const rated = await owner.ctx.post(`/tasks/${task.id}/rate`, {
      headers: owner.headers,
      data: { score: 4, review: "e2e great service", serviceName: "Oil Change" },
    });
    expect(rated.status(), await rated.text()).toBe(201);

    const ratings = (await (await owner.ctx.get("/ratings", { headers: owner.headers })).json()) as {
      taskId: string;
      score: number;
      review: string;
    }[];
    const saved = ratings.find((r) => r.taskId === task.id);
    expect(saved, "the rating should be stored").toBeTruthy();
    expect(saved!.score).toBe(4);

    const removed = await owner.ctx.delete(`/tasks/${task.id}/rate`, { headers: owner.headers });
    expect(removed.ok()).toBeTruthy();
    const after = (await (await owner.ctx.get("/ratings", { headers: owner.headers })).json()) as { taskId: string }[];
    expect(after.some((r) => r.taskId === task.id)).toBe(false);
  });

  test("pays an invoice and rejects double payment", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e payment" });
    await completeTask(advisor, task.id);

    const invoice = await invoiceForTask(owner, task.id);
    expect(invoice, "completing the work should raise an invoice").toBeTruthy();
    expect(invoice!.status).toBe("unpaid");
    expect(invoice!.total).toBeGreaterThan(0);

    const paid = await owner.ctx.post(`/invoices/${invoice!.id}/pay`, {
      headers: owner.headers,
      data: { method: "mobile" },
    });
    expect(paid.ok(), await paid.text()).toBeTruthy();
    expect(((await paid.json()) as { status: string }).status).toBe("paid");

    const again = await owner.ctx.post(`/invoices/${invoice!.id}/pay`, {
      headers: owner.headers,
      data: { method: "cash" },
    });
    expect(again.status()).toBe(409);
  });

  test("archives completed work into the service history and restores it", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e history" });
    await completeTask(advisor, task.id);

    const archived = await owner.ctx.patch(`/tasks/${task.id}/archive`, { headers: owner.headers });
    expect(archived.ok(), await archived.text()).toBeTruthy();

    const active = (await (await owner.ctx.get("/tasks", { headers: owner.headers })).json()) as { id: string }[];
    expect(active.some((t) => t.id === task.id), "archived work leaves the active list").toBe(false);

    const history = (await (await owner.ctx.get("/tasks/archived", { headers: owner.headers })).json()) as {
      id: string;
      vehicleId: string;
    }[];
    const entry = history.find((t) => t.id === task.id);
    expect(entry, "archived work appears in the per-vehicle history").toBeTruthy();
    expect(entry!.vehicleId).toBe(task.vehicleId);

    const restored = await owner.ctx.patch(`/tasks/${task.id}/restore`, { headers: owner.headers });
    expect(restored.ok()).toBeTruthy();
    const back = (await (await owner.ctx.get("/tasks", { headers: owner.headers })).json()) as { id: string }[];
    expect(back.some((t) => t.id === task.id)).toBe(true);
  });

  test("bulk-archives completed work", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const first = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e bulk 1" });
    const second = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e bulk 2" });
    await completeTask(advisor, first.id);
    await completeTask(advisor, second.id);

    const res = await owner.ctx.post("/tasks/archive", {
      headers: owner.headers,
      data: { ids: [first.id, second.id] },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    expect(((await res.json()) as { archived: number }).archived).toBe(2);
  });

  test("cannot touch another owner's work", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const other = await loginUser(playwright, "david.thompson@example.com", "password123");

    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e ownership" });
    await advanceTask(advisor, task.id, "ready");

    const rating = await other.ctx.post(`/tasks/${task.id}/rate`, {
      headers: other.headers,
      data: { score: 5, review: "not mine", serviceName: "Oil Change" },
    });
    expect(rating.status()).toBe(403);

    const archive = await other.ctx.patch(`/tasks/${task.id}/archive`, { headers: other.headers });
    expect(archive.status()).toBe(403);
  });
});
