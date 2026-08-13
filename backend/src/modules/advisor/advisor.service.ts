import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AssignMechanicBody, CreateEstimateBody, CreateJobCardBody } from "./advisor.types.js";

type IdRow = { id: string };
type FindManyIds = (args: { select: { id: true } }) => Promise<IdRow[]>;

async function nextSequentialId(prefix: string, base: number, findMany: FindManyIds): Promise<number> {
  const rows = await findMany({ select: { id: true } });
  return rows.reduce((max, row) => {
    const match = new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\d+)$`).exec(row.id);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, base);
}

export async function createJobCard(advisorId: string, body: CreateJobCardBody) {
  const maxNum = await nextSequentialId("JC-", 1040, prisma.jobCard.findMany);
  const id = `JC-${maxNum + 1}`;
  const job = await prisma.jobCard.create({
    data: {
      id,
      vehicleId: body.vehicleId,
      customerId: body.customerId,
      advisorId,
      issues: body.issues,
      priority: (body.priority ?? "medium").toUpperCase() as never,
      station: body.station,
      mileage: body.mileage,
      fuelLevel: body.fuelLevel,
      keysReceived: body.keysReceived,
      accessories: body.accessories,
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
  const maxNum = await nextSequentialId("ES-", 3300, prisma.estimate.findMany);
  const total = body.items.reduce((sum, i) => sum + i.amount, 0);
  return prisma.estimate.create({
    data: {
      id: `ES-${maxNum + 1}`,
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
