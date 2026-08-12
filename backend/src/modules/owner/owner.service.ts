import { prisma } from "../../lib/prisma.js";
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
    include: { messages: true },
  });
}
