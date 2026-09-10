import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  BookAppointmentBody,
  CreateVehicleBody,
  DecideEstimateBody,
  PayInvoiceBody,
  RateJobBody,
} from "./owner.types.js";

export function createVehicle(ownerId: string, body: CreateVehicleBody) {
  const { photos, fuelType, ownerId: _ownerId, ...rest } = body;
  return prisma.vehicle.create({
    data: {
      ...rest,
      photos: photos ? (photos as unknown as Prisma.InputJsonValue) : undefined,
      ownerId,
      fuelType: fuelType.toUpperCase() as never,
    },
  });
}

export async function updateVehicle(ownerId: string, id: string, body: Partial<CreateVehicleBody>) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (vehicle.ownerId !== ownerId) throw new ApiError(403, "Insufficient permissions");
  const { fuelType, photos, ...rest } = body;
  return prisma.vehicle.update({
    where: { id },
    data: {
      ...rest,
      ...(photos ? { photos: photos as unknown as Prisma.InputJsonValue } : {}),
      ...(fuelType ? { fuelType: fuelType.toUpperCase() as never } : {}),
    },
  });
}

export async function deleteVehicle(ownerId: string, id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (vehicle.ownerId !== ownerId) throw new ApiError(403, "Insufficient permissions");
  await prisma.$transaction([
    prisma.appointment.deleteMany({ where: { vehicleId: id } }),
    prisma.taskCard.deleteMany({ where: { vehicleId: id } }),
    prisma.vehicle.delete({ where: { id } }),
  ]);
}

export function bookAppointment(ownerId: string, body: BookAppointmentBody) {
  return prisma.appointment.create({
    data: { ...body, ownerId, notes: body.notes ?? "", status: "PENDING" },
  });
}

export async function decideEstimate(id: string, decision: DecideEstimateBody["decision"], customerId: string) {
  const estimate = await prisma.estimate.findUnique({ where: { id } });
  if (!estimate) throw new ApiError(404, "Estimate not found");
  if (estimate.customerId !== customerId) throw new ApiError(403, "Insufficient permissions");
  return prisma.estimate.update({
    where: { id },
    data: { status: decision.toUpperCase() as never },
  });
}

export async function payInvoice(id: string, method: PayInvoiceBody["method"], userId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (invoice.customerId !== userId) throw new ApiError(403, "Insufficient permissions");
  if (invoice.status === "PAID") throw new ApiError(409, "Invoice is already paid");
  await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: invoice.id, taskCardId: invoice.taskId, amount: invoice.total, method: method.toUpperCase() as never },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paymentMethod: method.toUpperCase() as never,
        last4: method === "card" ? "4242" : null,
        paidAt: new Date(),
      },
    }),
  ]);
  return invoice;
}

export async function rateTask(taskId: string, customerId: string, body: RateJobBody) {
  const task = await prisma.taskCard.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.customerId !== customerId) throw new ApiError(403, "Insufficient permissions");
  if (task.status !== "COMPLETED" && task.status !== "READY") {
    throw new ApiError(409, "Only completed or ready tasks can be rated");
  }
  return prisma.rating.upsert({
    where: { taskId_customerId: { taskId, customerId } },
    update: { score: body.score, review: body.review, serviceName: body.serviceName, date: new Date() },
    create: { taskId, customerId, score: body.score, review: body.review, serviceName: body.serviceName },
  });
}
export const rateJob = rateTask;

export async function deleteRating(taskId: string, customerId: string) {
  const task = await prisma.taskCard.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.customerId !== customerId) throw new ApiError(403, "Insufficient permissions");
  await prisma.rating.deleteMany({ where: { taskId, customerId } });
}

export async function archiveTask(taskId: string, customerId: string) {
  const task = await prisma.taskCard.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.customerId !== customerId) throw new ApiError(403, "Insufficient permissions");
  if (task.status !== "COMPLETED" && task.status !== "READY") {
    throw new ApiError(409, "Only completed or ready tasks can be archived");
  }
  return prisma.taskCard.update({ where: { id: taskId }, data: { ownerArchivedAt: new Date() } });
}
export const archiveJob = archiveTask;

export async function restoreTask(taskId: string, customerId: string) {
  const task = await prisma.taskCard.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.customerId !== customerId) throw new ApiError(403, "Insufficient permissions");
  return prisma.taskCard.update({ where: { id: taskId }, data: { ownerArchivedAt: null } });
}
export const restoreJob = restoreTask;

export async function bulkArchiveTasks(ids: string[], customerId: string) {
  if (ids.length === 0) throw new ApiError(400, "No tasks selected");
  const tasks = await prisma.taskCard.findMany({ where: { id: { in: ids } }, select: { id: true, customerId: true, status: true } });
  if (tasks.length !== ids.length || tasks.some((j) => j.customerId !== customerId)) {
    throw new ApiError(403, "Insufficient permissions");
  }
  if (tasks.some((j) => j.status !== "COMPLETED" && j.status !== "READY")) {
    throw new ApiError(409, "Only completed or ready tasks can be archived");
  }
  const res = await prisma.taskCard.updateMany({ where: { id: { in: ids } }, data: { ownerArchivedAt: new Date() } });
  return { archived: res.count };
}
export const bulkArchiveJobs = bulkArchiveTasks;


export function createChatThread(ownerId: string, advisorId: string, subject: string | undefined, text: string) {
  return prisma.chatThread.create({
    data: {
      ownerId,
      advisorId,
      subject: subject ?? "Vehicle service inquiry",
      messages: { create: { sender: "OWNER", text } },
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      advisor: { select: { id: true, name: true, avatar: true } },
      messages: true,
    },
  });
}
