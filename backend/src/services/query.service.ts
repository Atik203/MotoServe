import { prisma } from "../lib/prisma.js";

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

export function listEmployees(role?: string) {
  return prisma.user.findMany({
    where: role ? { role: role.toUpperCase() as never } : { role: { in: ["ADVISOR", "MECHANIC"] } },
    orderBy: { name: "asc" },
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

export function listParts() {
  return prisma.part.findMany({ orderBy: { name: "asc" } });
}

export function listCustomers() {
  return prisma.user.findMany({ where: { role: "OWNER" }, orderBy: { createdAt: "desc" } });
}

export function listRatings() {
  return prisma.rating.findMany({ include: { job: true }, orderBy: { date: "desc" } });
}

export function listTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { date: "desc" } });
}

export function listAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { time: "desc" }, take: 50 });
}

export async function getDashboardStats() {
  const [activeJobs, totalRevenue, revenueByMonthRaw, customers, employees] = await Promise.all([
    prisma.jobCard.count({ where: { status: { notIn: ["COMPLETED", "READY"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "PAID" } }),
    prisma.invoice.findMany({ select: { issuedAt: true, total: true } }),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.user.count({ where: { role: { in: ["ADVISOR", "MECHANIC"] }, status: "ACTIVE" } }),
  ]);

  const revenueByMonth = Array.from(
    revenueByMonthRaw
      .filter((i) => i.issuedAt.getFullYear() === new Date().getFullYear())
      .reduce((map, i) => {
        const key = i.issuedAt.toLocaleString("en-US", { month: "short" });
        map.set(key, (map.get(key) ?? 0) + i.total);
        return map;
      }, new Map<string, number>()),
    ([month, revenue]) => ({ month, revenue: Math.round(revenue) }),
  );

  return {
    totalRevenue: totalRevenue._sum.total ?? 0,
    activeJobs,
    registeredCustomers: customers,
    activeEmployees: employees,
    revenueByMonth,
  };
}
