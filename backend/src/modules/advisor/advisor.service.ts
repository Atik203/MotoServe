import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "../../generated/prisma/client.js";
import type { AssignMechanicBody, CreateCustomerBody, CreateEstimateBody, CreateJobCardBody } from "./advisor.types.js";

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
  if (body.appointmentId) {
    const appointment = await prisma.appointment.findUnique({ where: { id: body.appointmentId } });
    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (appointment.vehicleId !== body.vehicleId) {
      throw new ApiError(400, "Appointment belongs to a different vehicle");
    }
  }
  const serviceLines = body.serviceIds?.length
    ? await prisma.service.findMany({ where: { id: { in: body.serviceIds } } })
    : [];
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
      appointmentId: body.appointmentId,
      expectedDate: body.expectedDate,
      services: serviceLines.length
        ? (serviceLines.map((s) => ({ id: s.id, name: s.name, price: s.basePrice })) as unknown as Prisma.InputJsonValue)
        : undefined,
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

export async function createCustomer(body: CreateCustomerBody) {
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return prisma.user.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email || `${body.phone.replace(/[^0-9]/g, "")}.walkin@motorserve.com`,
      passwordHash,
      role: "OWNER",
      status: "PENDING",
      nid: body.nid,
      occupation: body.occupation,
      street: body.street,
      city: body.city,
      district: body.district,
      zip: body.zip,
      country: body.country,
    },
  });
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
