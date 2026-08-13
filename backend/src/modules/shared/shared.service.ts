import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { CustomerStatus } from "./shared.types.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function listServices() {
  return prisma.service.findMany({ orderBy: { name: "asc" } });
}

export function listVehicles(ownerId?: string) {
  return prisma.vehicle.findMany({
    where: { ownerId: ownerId ?? undefined },
    orderBy: { createdAt: "desc" },
  });
}

export function listJobs(role?: string, userId?: string) {
  return prisma.jobCard.findMany({
    where: { mechanicId: role === "mechanic" ? userId : undefined },
    include: {
      vehicle: true,
      customer: { select: { id: true, name: true } },
      advisor: { select: { id: true, name: true } },
      mechanic: { select: { id: true, name: true } },
      progress: { orderBy: { id: "asc" } },
      notes: { orderBy: { id: "desc" } },
      partsUsed: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findJobById(id: string) {
  return prisma.jobCard.findUnique({
    where: { id },
    include: {
      vehicle: true,
      customer: { select: { id: true, name: true } },
      advisor: { select: { id: true, name: true } },
      mechanic: { select: { id: true, name: true } },
      progress: { orderBy: { id: "asc" } },
      notes: { orderBy: { id: "desc" } },
      partsUsed: true,
      estimates: { include: { items: true } },
      invoices: true,
    },
  });
}

export function listAppointments(ownerId?: string) {
  return prisma.appointment.findMany({
    where: { ownerId: ownerId ?? undefined },
    include: { vehicle: true, owner: { select: { id: true, name: true } } },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
}

export async function updateAppointment(
  id: string,
  status: string,
  role: string | undefined,
  userId: string | undefined,
) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (role === "OWNER") {
    if (appointment.ownerId !== userId) throw new ApiError(403, "Insufficient permissions");
    if (status !== "cancelled") throw new ApiError(403, "Owners can only cancel appointments");
  }
  return prisma.appointment.update({ where: { id }, data: { status: status.toUpperCase() as never } });
}

export function listEmployees(role?: string) {
  return prisma.user.findMany({
    where: role ? { role: role.toUpperCase() as never } : { role: { in: ["ADVISOR", "MECHANIC"] } },
    orderBy: { name: "asc" },
  });
}

export function listCustomers() {
  return prisma.user.findMany({
    where: { role: "OWNER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      nid: true,
      drivingLicense: true,
      occupation: true,
      street: true,
      city: true,
      district: true,
      zip: true,
      country: true,
      dateOfBirth: true,
      gender: true,
      avatar: true,
      documentUrl: true,
      emergencyName: true,
      emergencyRelation: true,
      emergencyPhone: true,
      status: true,
      verifiedAt: true,
      joinedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listEstimates(customerId?: string) {
  return prisma.estimate.findMany({
    where: { customerId: customerId ?? undefined },
    include: {
      items: true,
      jobCard: { select: { id: true, vehicle: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listInvoices(customerId?: string) {
  return prisma.invoice.findMany({
    where: { customerId: customerId ?? undefined },
    include: { job: true, vehicle: true, payment: true },
    orderBy: { issuedAt: "desc" },
  });
}

export function listThreads(role?: string, userId?: string) {
  return prisma.chatThread.findMany({
    where: { ownerId: role === "owner" ? userId : undefined, advisorId: role === "advisor" ? userId : undefined },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      advisor: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { time: "asc" } },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export function markThreadRead(id: string, role: string | undefined) {
  return prisma.chatThread.update({
    where: { id },
    data: role === "OWNER" ? { ownerUnread: 0 } : { advisorUnread: 0 },
  });
}

export function listParts() {
  return prisma.part.findMany({ orderBy: { name: "asc" } });
}

export function listRatings(customerId?: string) {
  return prisma.rating.findMany({
    where: { customerId: customerId ?? undefined },
    include: { job: true },
    orderBy: { date: "desc" },
  });
}

export function listTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { date: "desc" } });
}

export function mapCustomerStatus(status: string): CustomerStatus {
  if (status === "ACTIVE") return "approved";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING") return "pending";
  return "inactive";
}
