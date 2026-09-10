import { prisma } from "../../lib/prisma.js";
import { createWithSequentialId } from "../../lib/ids.js";
import { ApiError } from "../../middleware/error.js";
import type { Invoice } from "../../generated/prisma/client.js";
import type { AddTaskNoteBody, AddPartUsedBody, UpdateTaskStatusBody } from "./mechanic.types.js";

const STATUS_ORDER = ["RECEIVED", "INSPECTING", "REPAIRING", "TESTING", "READY", "COMPLETED"];

export async function updateTaskStatus(id: string, status: UpdateTaskStatusBody["status"]) {
  const task = await prisma.taskCard.findUnique({ where: { id } });
  if (!task) throw new ApiError(404, "Task not found");
  const targetIdx = STATUS_ORDER.indexOf(status.toUpperCase());
  if (targetIdx < 0) throw new ApiError(400, "Invalid task status");
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  if (task.status === "COMPLETED") throw new ApiError(400, "Task is already completed");
  if (targetIdx < currentIdx) throw new ApiError(400, "Cannot move a task backwards through its lifecycle");
  const progress = await prisma.taskProgress.findMany({ where: { taskCardId: task.id } });
  const ops = progress.map((step) => {
    const idx = STATUS_ORDER.indexOf(step.step);
    const done = idx <= targetIdx;
    return prisma.taskProgress.update({
      where: { id: step.id },
      data: {
        done,
        timestamp:
          done && !step.timestamp
            ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : step.timestamp,
      },
    });
  });
  await prisma.$transaction([
    prisma.taskCard.update({ where: { id: task.id }, data: { status: status.toUpperCase() as never } }),
    ...ops,
  ]);
  if (status.toUpperCase() === "COMPLETED") {
    await ensureInvoiceForTask(task.id);
  }
  return prisma.taskCard.findUniqueOrThrow({ where: { id: task.id } });
}
export const updateJobStatus = updateTaskStatus;

export async function ensureInvoiceForTask(taskId: string) {
  const existing = await prisma.invoice.findFirst({ where: { taskId } });
  if (existing) return existing;

  const task = await prisma.taskCard.findUniqueOrThrow({
    where: { id: taskId },
    include: { partsUsed: true },
  });
  const services = (task.services ?? []) as { id?: string; name: string; price: number }[];
  const estimate = await prisma.estimate.findFirst({
    where: { taskCardId: taskId },
    include: { items: true },
  });

  const laborTotal = estimate?.items.filter((i) => i.category === "LABOR").reduce((sum, i) => sum + i.amount, 0) ?? 0;
  const servicesTotal = services.reduce((sum, sv) => sum + sv.price, 0);
  const partsTotal = task.partsUsed.reduce((sum, p) => sum + p.subtotal, 0);
  const subtotal = servicesTotal + partsTotal + laborTotal;
  const tax = subtotal * 0.085;
  const total = subtotal + tax;

  const year = new Date().getFullYear();

  const laborItems = (estimate?.items ?? [])
    .filter((i) => i.category === "LABOR")
    .map((i) => ({
      id: i.id ?? `lab-${crypto.randomUUID().slice(0, 8)}`,
      description: i.description ?? "Labor",
      category: "service",
      amount: i.amount,
    }));

  const items = [
    ...services.map((sv) => ({
      id: sv.id ?? `svc-${crypto.randomUUID().slice(0, 8)}`,
      description: sv.name,
      category: "service",
      amount: sv.price,
    })),
    ...laborItems,
    ...task.partsUsed.map((p) => ({
      id: p.id,
      description: p.name,
      category: "parts",
      amount: p.subtotal,
    })),
  ];

  return createWithSequentialId<Invoice>(prisma.invoice, `INV-${year}-`, 0, (id) => ({
    data: {
      id,
      taskId: task.id,
      customerId: task.customerId,
      vehicleId: task.vehicleId,
      items,
      laborTotal,
      partsTotal,
      subtotal,
      tax,
      total,
      status: "UNPAID",
    },
  }));
}
export const ensureInvoiceForJob = ensureInvoiceForTask;

export function addTaskNote(id: string, body: AddTaskNoteBody) {
  return prisma.taskNote.create({
    data: {
      taskCardId: id,
      author: body.author,
      text: body.text,
      time: body.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  });
}
export const addJobNote = addTaskNote;

export function addPartUsed(id: string, body: AddPartUsedBody) {
  return prisma.partsUsed.create({
    data: { taskCardId: id, name: body.name, qty: body.qty, unitPrice: body.unitPrice, supplier: body.supplier, subtotal: body.qty * body.unitPrice },
  });
}

export async function addTaskPhoto(id: string, key: string) {
  const task = await prisma.taskCard.findUniqueOrThrow({ where: { id } });
  const photos = Array.isArray(task.photos) ? (task.photos as string[]) : [];
  return prisma.taskCard.update({
    where: { id },
    data: { photos: [...photos, key] },
  });
}
export const addJobPhoto = addTaskPhoto;

