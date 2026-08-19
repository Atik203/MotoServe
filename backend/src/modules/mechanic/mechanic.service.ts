import { prisma } from "../../lib/prisma.js";
import { createWithSequentialId } from "../../lib/ids.js";
import { ApiError } from "../../middleware/error.js";
import type { Invoice } from "../../generated/prisma/client.js";
import type { AddJobNoteBody, AddPartUsedBody, UpdateJobStatusBody } from "./mechanic.types.js";

const STATUS_ORDER = ["RECEIVED", "INSPECTING", "REPAIRING", "TESTING", "READY", "COMPLETED"];

export async function updateJobStatus(id: string, status: UpdateJobStatusBody["status"]) {
  const job = await prisma.jobCard.findUnique({ where: { id } });
  if (!job) throw new ApiError(404, "Job not found");
  const targetIdx = STATUS_ORDER.indexOf(status.toUpperCase());
  if (targetIdx < 0) throw new ApiError(400, "Invalid job status");
  const currentIdx = STATUS_ORDER.indexOf(job.status);
  if (job.status === "COMPLETED") throw new ApiError(400, "Job is already completed");
  if (targetIdx < currentIdx) throw new ApiError(400, "Cannot move a job backwards through its lifecycle");
  const progress = await prisma.jobProgress.findMany({ where: { jobCardId: job.id } });
  const ops = progress.map((step) => {
    const idx = STATUS_ORDER.indexOf(step.step);
    const done = idx <= targetIdx;
    return prisma.jobProgress.update({
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
    prisma.jobCard.update({ where: { id: job.id }, data: { status: status.toUpperCase() as never } }),
    ...ops,
  ]);
  if (status.toUpperCase() === "COMPLETED") {
    await ensureInvoiceForJob(job.id);
  }
  return prisma.jobCard.findUniqueOrThrow({ where: { id: job.id } });
}

export async function ensureInvoiceForJob(jobId: string) {
  const existing = await prisma.invoice.findFirst({ where: { jobId } });
  if (existing) return existing;

  const job = await prisma.jobCard.findUniqueOrThrow({
    where: { id: jobId },
    include: { partsUsed: true },
  });
  const services = (job.services ?? []) as { id?: string; name: string; price: number }[];
  const estimate = await prisma.estimate.findFirst({
    where: { jobCardId: jobId },
    include: { items: true },
  });

  const laborTotal = estimate?.items.filter((i) => i.category === "LABOR").reduce((sum, i) => sum + i.amount, 0) ?? 0;
  const servicesTotal = services.reduce((sum, sv) => sum + sv.price, 0);
  const partsTotal = job.partsUsed.reduce((sum, p) => sum + p.subtotal, 0);
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
    ...job.partsUsed.map((p) => ({
      id: p.id,
      description: p.name,
      category: "parts",
      amount: p.subtotal,
    })),
  ];

  return createWithSequentialId<Invoice>(prisma.invoice, `INV-${year}-`, 0, (id) => ({
    data: {
      id,
      jobId: job.id,
      customerId: job.customerId,
      vehicleId: job.vehicleId,
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

export function addJobNote(id: string, body: AddJobNoteBody) {
  return prisma.jobNote.create({
    data: {
      jobCardId: id,
      author: body.author,
      text: body.text,
      time: body.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  });
}

export function addPartUsed(id: string, body: AddPartUsedBody) {
  return prisma.partsUsed.create({
    data: { jobCardId: id, name: body.name, qty: body.qty, unitPrice: body.unitPrice, supplier: body.supplier, subtotal: body.qty * body.unitPrice },
  });
}

export async function addJobPhoto(id: string, key: string) {
  const job = await prisma.jobCard.findUniqueOrThrow({ where: { id } });
  const photos = Array.isArray(job.photos) ? (job.photos as string[]) : [];
  return prisma.jobCard.update({
    where: { id },
    data: { photos: [...photos, key] },
  });
}
