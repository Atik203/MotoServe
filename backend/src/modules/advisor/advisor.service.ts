import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AssignMechanicBody, CreateEstimateBody, CreateJobCardBody } from "./advisor.types.js";

export async function createJobCard(advisorId: string, body: CreateJobCardBody) {
  const count = await prisma.jobCard.count();
  const id = `JC-${1040 + count + 1}`;
  const job = await prisma.jobCard.create({
    data: {
      id,
      vehicleId: body.vehicleId,
      customerId: body.customerId,
      advisorId,
      issues: body.issues,
      priority: (body.priority ?? "medium").toUpperCase() as never,
      station: body.station,
      status: "RECEIVED",
    },
  });
  await prisma.jobProgress.createMany({
    data: [
      { jobCardId: job.id, step: "RECEIVED", label: "Vehicle Received", done: true },
      { jobCardId: job.id, step: "INSPECTING", label: "Initial Inspection", done: false },
      { jobCardId: job.id, step: "REPAIRING", label: "Repairing", done: false },
      { jobCardId: job.id, step: "TESTING", label: "Testing", done: false },
      { jobCardId: job.id, step: "COMPLETED", label: "Completed", done: false },
    ],
  });
  return job;
}

export function assignMechanic(id: string, body: AssignMechanicBody) {
  return prisma.jobCard.update({
    where: { id },
    data: { mechanicId: body.mechanicId, station: body.station },
  });
}

export async function createEstimate(advisorId: string, body: CreateEstimateBody) {
  const job = await prisma.jobCard.findUnique({ where: { id: body.jobId }, select: { customerId: true } });
  if (!job) throw new ApiError(404, "Job not found");
  const count = await prisma.estimate.count();
  const total = body.items.reduce((sum, i) => sum + i.amount, 0);
  return prisma.estimate.create({
    data: {
      id: `ES-${3300 + count + 1}`,
      jobCardId: body.jobId,
      customerId: job.customerId,
      advisorId,
      summary: body.summary ?? "",
      total,
      items: {
        create: body.items.map((i) => ({
          description: i.description,
          category: i.category.toUpperCase() as never,
          amount: i.amount,
        })),
      },
    },
    include: { items: true },
  });
}
