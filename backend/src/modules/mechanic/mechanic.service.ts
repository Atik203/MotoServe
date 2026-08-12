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
  return updated;
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
