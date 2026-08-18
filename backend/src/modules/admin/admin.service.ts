import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { findUserByEmail } from "../shared/shared.service.js";
import type { CreateEmployeeBody, CreateServiceBody, ReportDto, UpdateEmployeeBody } from "./admin.types.js";

export function createService(data: CreateServiceBody) {
  return prisma.service.create({
    data: { ...data, description: data.description ?? "", category: data.category.toUpperCase() as never },
  });
}

export function updateService(id: string, data: Record<string, unknown>) {
  return prisma.service.update({
    where: { id },
    data: data.category ? { ...data, category: String(data.category).toUpperCase() } : data,
  });
}

export function deleteService(id: string) {
  return prisma.service.delete({ where: { id } });
}

export function verifyCustomerStatus(id: string, decision: "approved" | "rejected") {
  return prisma.user.update({
    where: { id },
    data: { status: decision === "approved" ? "ACTIVE" : "REJECTED", verifiedAt: decision === "approved" ? new Date() : null },
  });
}

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  station: true,
  specialization: true,
  status: true,
  joinedAt: true,
} as const;

export async function createEmployee(data: CreateEmployeeBody) {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new ApiError(409, "Email already registered");
  const { password, role, ...profile } = data;
  return prisma.user.create({
    data: {
      ...profile,
      passwordHash: await bcrypt.hash(password, 10),
      role: role.toUpperCase() as never,
      status: "ACTIVE",
    },
    select: employeeSelect,
  });
}

export function updateEmployee(id: string, data: UpdateEmployeeBody) {
  const { password, status, ...rest } = data;
  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { passwordHash: bcrypt.hashSync(password, 10) } : {}),
      ...(status ? { status: status.toUpperCase() as never } : {}),
    },
    select: employeeSelect,
  });
}

export function deactivateEmployee(id: string) {
  return prisma.user.update({ where: { id }, data: { status: "INACTIVE" }, select: employeeSelect });
}

export async function getReportData(): Promise<ReportDto> {
  const [stats, jobsByStatus, mechanics, activityLog, jobCards] = await Promise.all([
    getDashboardStats(),
    prisma.jobCard.groupBy({ by: ["status"], _count: true }),
    prisma.user.findMany({
      where: { role: "MECHANIC" },
      include: { _count: { select: { jobCardsAssigned: true } } },
    }),
    listAuditLogs(),
    prisma.jobCard.findMany({ select: { mechanicId: true, status: true, services: true } }),
  ]);

  const completedByMechanic = jobCards
    .filter((j) => j.status === "COMPLETED" && j.mechanicId)
    .reduce<Record<string, number>>((map, j) => {
      map[j.mechanicId!] = (map[j.mechanicId!] ?? 0) + 1;
      return map;
    }, {});

  const serviceCount = new Map<string, number>();
  for (const job of jobCards) {
    const services = (job.services ?? []) as { name?: string }[];
    for (const s of services) {
      if (!s.name) continue;
      serviceCount.set(s.name, (serviceCount.get(s.name) ?? 0) + 1);
    }
  }
  const serviceTotal = [...serviceCount.values()].reduce((sum, n) => sum + n, 0);
  const fallbackCategories = await prisma.service.groupBy({ by: ["category"], _count: true });
  const fallbackTotal = fallbackCategories.reduce((sum, c) => sum + c._count, 0);
  const serviceDistribution =
    serviceTotal > 0
      ? [...serviceCount.entries()]
          .map(([name, count]) => ({ name, pct: Math.round((count / serviceTotal) * 100) }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 4)
      : fallbackCategories.map((c) => ({
          name: c.category.charAt(0) + c.category.slice(1).toLowerCase(),
          pct: fallbackTotal > 0 ? Math.round((c._count / fallbackTotal) * 100) : 0,
        }));

  return {
    ...stats,
    revenueByMonth: stats.revenueByMonth,
    jobsByStatus: jobsByStatus.map((j) => ({ status: j.status.toLowerCase(), count: j._count })),
    workloadByMechanic: mechanics.map((m) => ({
      mechanic: m.name,
      role: m.specialization ?? "Technician",
      active: m._count.jobCardsAssigned,
      completed: completedByMechanic[m.id] ?? 0,
    })),
    serviceDistribution,
    activityLog: activityLog.map((a) => ({ id: a.id, user: a.user, action: a.action, time: a.time })),
  };
}

function listAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { time: "desc" }, take: 50 });
}

async function getDashboardStats() {
  const [activeJobs, totalRevenue, revenueByMonthRaw, customers, employees] = await Promise.all([
    prisma.jobCard.count({ where: { status: { notIn: ["COMPLETED", "READY"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "PAID" } }),
    prisma.invoice.findMany({ select: { issuedAt: true, total: true }, where: { status: "PAID" } }),
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
