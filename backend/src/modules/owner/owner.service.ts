import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type {
  BookAppointmentBody,
  CreateVehicleBody,
  DecideEstimateBody,
  PayInvoiceBody,
  RateJobBody,
} from "./owner.types.js";

export function createVehicle(ownerId: string, body: CreateVehicleBody) {
  return prisma.vehicle.create({
    data: { ...body, ownerId, fuelType: body.fuelType.toUpperCase() as never },
  });
}

export async function updateVehicle(ownerId: string, id: string, body: Partial<CreateVehicleBody>) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (vehicle.ownerId !== ownerId) throw new ApiError(403, "Insufficient permissions");
  const { fuelType, ...rest } = body;
  return prisma.vehicle.update({
    where: { id },
    data: {
      ...rest,
      ...(fuelType ? { fuelType: fuelType.toUpperCase() as never } : {}),
    },
  });
}

export async function deleteVehicle(ownerId: string, id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (vehicle.ownerId !== ownerId) throw new ApiError(403, "Insufficient permissions");
  await prisma.vehicle.delete({ where: { id } });
}

export function bookAppointment(ownerId: string, body: BookAppointmentBody) {
  return prisma.appointment.create({
    data: { ...body, ownerId, notes: body.notes ?? "", status: "PENDING" },
  });
}

export function decideEstimate(id: string, decision: DecideEstimateBody["decision"]) {
  return prisma.estimate.update({
    where: { id },
    data: { status: decision.toUpperCase() as never },
  });
}

export async function payInvoice(id: string, method: PayInvoiceBody["method"]) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: invoice.id, jobCardId: invoice.jobId, amount: invoice.total, method: method.toUpperCase() as never },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paymentMethod: method.toUpperCase() as never, last4: "4242", paidAt: new Date() },
    }),
  ]);
  return invoice;
}

export function rateJob(jobId: string, customerId: string, body: RateJobBody) {
  return prisma.rating.create({
    data: { jobId, customerId, score: body.score, review: body.review, serviceName: body.serviceName },
  });
}

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
