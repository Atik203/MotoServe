import { test, expect } from "@playwright/test";
import type { Playwright } from "@playwright/test";
import { activeMechanics, apiAs, createWalkInTask, loginUser, type ApiSession } from "../helpers/api";

async function secondMechanic(playwright: Playwright): Promise<ApiSession | null> {
  const primary = await apiAs(playwright, "mechanic");
  const advisor = await apiAs(playwright, "advisor");
  const mechanics = await activeMechanics(advisor);
  if (mechanics.filter((m) => m.id !== primary.user.id).length === 0) return null;
  try {
    const other = await loginUser(playwright, "priya.nair@motorserve.com", "password123");
    return other.user.id === primary.user.id ? null : other;
  } catch {
    return null;
  }
}

test.describe("mechanic", () => {
  test("sees the task cards assigned to them and not others'", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const mechanicA = await apiAs(playwright, "mechanic");
    const mechanicB = await secondMechanic(playwright);
    test.skip(!mechanicB, "needs a second mechanic account");

    const task = await createWalkInTask(advisor, {
      mechanicIds: [mechanicA.user.id],
      issues: "assigned only to mechanic A",
    });

    const mine = (await (await mechanicA.ctx.get("/tasks", { headers: mechanicA.headers })).json()) as { id: string }[];
    expect(mine.some((t) => t.id === task.id), "assigned mechanic should see the task").toBe(true);

    const theirs = (await (await mechanicB!.ctx.get("/tasks", { headers: mechanicB!.headers })).json()) as { id: string }[];
    expect(theirs.some((t) => t.id === task.id), "other mechanic should not see the task").toBe(false);
  });

  test("updates repair progress through the lifecycle and blocks moving backwards", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const mechanic = await apiAs(playwright, "mechanic");
    const task = await createWalkInTask(advisor, { mechanicIds: [mechanic.user.id] });

    for (const status of ["inspecting", "repairing", "testing", "ready"]) {
      const res = await mechanic.ctx.patch(`/tasks/${task.id}/status`, {
        headers: mechanic.headers,
        data: { status },
      });
      expect(res.ok(), `moving to ${status} should succeed: ${await res.text()}`).toBeTruthy();
      const updated = (await (await mechanic.ctx.get(`/tasks/${task.id}`, { headers: mechanic.headers })).json()) as {
        status: string;
        progress: { step: string; done: boolean }[];
      };
      expect(updated.status).toBe(status);
      expect(updated.progress.find((p) => p.step === status)?.done).toBe(true);
    }

    const backwards = await mechanic.ctx.patch(`/tasks/${task.id}/status`, {
      headers: mechanic.headers,
      data: { status: "received" },
    });
    expect(backwards.status()).toBe(400);
  });

  test("adds notes, parts used and repair photos", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const mechanic = await apiAs(playwright, "mechanic");
    const task = await createWalkInTask(advisor, { mechanicIds: [mechanic.user.id] });

    const note = await mechanic.ctx.post(`/tasks/${task.id}/notes`, {
      headers: mechanic.headers,
      data: { author: mechanic.user.name, text: "e2e note: front pads worn" },
    });
    expect(note.ok(), await note.text()).toBeTruthy();

    const part = await mechanic.ctx.post(`/tasks/${task.id}/parts`, {
      headers: mechanic.headers,
      data: { name: "Brake Pad Set", qty: 2, unitPrice: 45, supplier: "OEM Parts Co" },
    });
    expect(part.ok(), await part.text()).toBeTruthy();

    const photo = await mechanic.ctx.post(`/tasks/${task.id}/photos`, {
      headers: mechanic.headers,
      data: { key: "MotoServe/images/e2e/repair-photo.png" },
    });
    expect(photo.ok(), await photo.text()).toBeTruthy();

    const detail = (await (await mechanic.ctx.get(`/tasks/${task.id}`, { headers: mechanic.headers })).json()) as {
      notes: { text: string }[];
      partsUsed: { name: string; qty: number; subtotal: number }[];
      photos: string[];
    };
    expect(detail.notes.some((n) => n.text.includes("front pads worn"))).toBe(true);
    const savedPart = detail.partsUsed.find((p) => p.name === "Brake Pad Set");
    expect(savedPart, "the part used should be recorded").toBeTruthy();
    expect(savedPart!.qty).toBe(2);
    expect(savedPart!.subtotal).toBe(90);
    expect(detail.photos).toContain("MotoServe/images/e2e/repair-photo.png");
  });

  test("can request parts and list requests", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const mechanic = await apiAs(playwright, "mechanic");
    const task = await createWalkInTask(advisor, { mechanicIds: [mechanic.user.id] });

    const created = await mechanic.ctx.post("/parts/request", {
      headers: mechanic.headers,
      data: { partName: "Timing Belt Kit", qty: 1, taskCardId: task.id, notes: "e2e request" },
    });
    expect(created.ok(), await created.text()).toBeTruthy();

    const list = (await (await mechanic.ctx.get("/parts/requests", { headers: mechanic.headers })).json()) as {
      partName: string;
      status: string;
    }[];
    const request = list.find((r) => r.partName === "Timing Belt Kit");
    expect(request, "the part request should be listed").toBeTruthy();
    expect(request!.status).toBe("pending");
  });

  test("marks a task completed, which finalises the work", async ({ playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const mechanic = await apiAs(playwright, "mechanic");
    const owner = await apiAs(playwright, "owner");
    const task = await createWalkInTask(advisor, { mechanicIds: [mechanic.user.id] });

    const res = await mechanic.ctx.patch(`/tasks/${task.id}/status`, {
      headers: mechanic.headers,
      data: { status: "completed" },
    });
    expect(res.ok(), await res.text()).toBeTruthy();

    const detail = (await (await mechanic.ctx.get(`/tasks/${task.id}`, { headers: mechanic.headers })).json()) as {
      status: string;
    };
    expect(detail.status).toBe("completed");

    // Completing a task auto-generates the invoice for the owner.
    const invoices = (await (await owner.ctx.get("/invoices", { headers: owner.headers })).json()) as {
      taskId: string;
    }[];
    expect(invoices.some((i) => i.taskId === task.id)).toBe(true);
  });
});
