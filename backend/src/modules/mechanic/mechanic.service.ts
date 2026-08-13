import { prisma } from "../../lib/prisma.js";
import type { AddJobNoteBody, AddPartUsedBody, UpdateJobStatusBody } from "./mechanic.types.js";

const STATUS_ORDER = ["RECEIVED", "INSPECTING", "REPAIRING", "TESTING", "READY", "COMPLETED"];

export async function updateJobStatus(id: string, status: UpdateJobStatusBody["status"]) {
  const job = await prisma.jobCard.findUniqueOrThrow({ where: { id } });
  const targetIdx = STATUS_ORDER.indexOf(status.toUpperCase());
  const updated = await prisma.jobCard.update({
    where: { id: job.id },
    data: { status: status.toUpperCase() as never },
  });
  const progress = await prisma.jobProgress.findMany({ where: { jobCardId: job.id } });
  for (const step of progress) {
    const idx = STATUS_ORDER.indexOf(step.step);
    await prisma.jobProgress.update({
      where: { id: step.id },
      data: {
        done: idx <= targetIdx,
        timestamp:
          idx <= targetIdx && !step.timestamp
            ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : step.timestamp,
      },
    });
  }
  if (status.toUpperCase() === "COMPLETED") {
    await ensureInvoiceForJob(job.id);
  }
  return updated;
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
  const rows = await prisma.invoice.findMany({ select: { id: true } });
  const maxNum = rows.reduce((max, row) => {
    const match = new RegExp(`^INV-${year}-(\\d+)$`).exec(row.id);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const id = `INV-${year}-${String(maxNum + 1).padStart(4, "0")}`;

  const items = [
    ...services.map((sv) => ({
      id: sv.id ?? `svc-${crypto.randomUUID().slice(0, 8)}`,
      description: sv.name,
      category: "service",
      amount: sv.price,
    })),
    ...job.partsUsed.map((p) => ({
      id: p.id,
      description: p.name,
      category: "parts",
      amount: p.subtotal,
    })),
  ];

  return prisma.invoice.create({
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
  });
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
