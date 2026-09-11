import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { findUserByEmail } from "../shared/shared.service.js";
import type { Prisma } from "../../generated/prisma/client.js";
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
  nid: true,
  documents: true,
  documentUrl: true,
  joinedAt: true,
} as const;

export async function createEmployee(data: CreateEmployeeBody) {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new ApiError(409, "Email already registered");
  const { password, role, dateOfBirth, documents, ...profile } = data;
  return prisma.user.create({
    data: {
      ...profile,
      ...(documents ? { documents: documents as unknown as Prisma.InputJsonValue } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      passwordHash: await bcrypt.hash(password, 10),
      role: role.toUpperCase() as never,
      status: "ACTIVE",
    },
    select: employeeSelect,
  });
}

export function updateEmployee(id: string, data: UpdateEmployeeBody) {
  const { password, status, dateOfBirth, documents, ...rest } = data;
  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(documents ? { documents: documents as unknown as Prisma.InputJsonValue } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...(password ? { passwordHash: bcrypt.hashSync(password, 10) } : {}),
      ...(status ? { status: status.toUpperCase() as never } : {}),
    },
    select: employeeSelect,
  });
}

export function deactivateEmployee(id: string) {
  return prisma.user.update({ where: { id }, data: { status: "INACTIVE" }, select: employeeSelect });
}

export interface ReportFilterOptions {
  from?: string;
  to?: string;
  station?: string;
  mechanicId?: string;
  service?: string;
  status?: string;
}

export async function getReportData(filters?: ReportFilterOptions): Promise<ReportDto> {
  const invoiceWhere: Record<string, any> = {};
  if (filters?.from || filters?.to) {
    invoiceWhere.issuedAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters?.status) {
    invoiceWhere.status = filters.status.toUpperCase();
  }
  if (filters?.station || filters?.mechanicId) {
    invoiceWhere.task = {
      ...(filters.station ? { station: { contains: filters.station, mode: "insensitive" } } : {}),
      ...(filters.mechanicId ? { OR: [{ mechanicId: filters.mechanicId }, { mechanicIds: { has: filters.mechanicId } }] } : {}),
    };
  }

  const taskWhere: Record<string, any> = {};
  if (filters?.from || filters?.to) {
    taskWhere.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters?.station) {
    taskWhere.station = { contains: filters.station, mode: "insensitive" };
  }
  if (filters?.mechanicId) {
    taskWhere.OR = [{ mechanicId: filters.mechanicId }, { mechanicIds: { has: filters.mechanicId } }];
  }
  if (filters?.status) {
    taskWhere.status = filters.status.toUpperCase();
  }

  const [stats, tasksByStatus, mechanics, activityLog, taskCards, allInvoices, ratingsStats] = await Promise.all([
    getDashboardStats(),
    prisma.taskCard.groupBy({ by: ["status"], where: Object.keys(taskWhere).length ? taskWhere : undefined, _count: true }),
    prisma.user.findMany({
      where: { role: "MECHANIC" },
      include: { _count: { select: { taskCardsAssigned: true } } },
    }),
    listAuditLogs(),
    prisma.taskCard.findMany({
      where: Object.keys(taskWhere).length ? taskWhere : undefined,
      select: { mechanicId: true, mechanicIds: true, status: true, services: true },
    }),
    prisma.invoice.findMany({
      where: Object.keys(invoiceWhere).length ? invoiceWhere : undefined,
      include: {
        vehicle: { select: { id: true, make: true, model: true, year: true, regNo: true } },
        task: {
          select: {
            id: true,
            status: true,
            station: true,
            customer: { select: { id: true, name: true } },
            mechanic: { select: { id: true, name: true } },
            mechanics: { select: { id: true, name: true } },
            services: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.rating.aggregate({ _avg: { score: true }, _count: true }),
  ]);

  const completedByMechanic: Record<string, number> = {};
  const activeByMechanic: Record<string, number> = {};

  for (const j of taskCards) {
    const assigned = j.mechanicIds?.length ? j.mechanicIds : (j.mechanicId ? [j.mechanicId] : []);
    if (j.status === "COMPLETED") {
      for (const mId of assigned) {
        completedByMechanic[mId] = (completedByMechanic[mId] ?? 0) + 1;
      }
    } else if (j.status !== "READY") {
      for (const mId of assigned) {
        activeByMechanic[mId] = (activeByMechanic[mId] ?? 0) + 1;
      }
    }
  }

  const serviceCount = new Map<string, number>();
  for (const task of taskCards) {
    const services = (task.services ?? []) as { name?: string }[];
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

  const mappedStatus = tasksByStatus.map((j) => ({ status: j.status.toLowerCase(), count: j._count }));

  const paidInvoices = allInvoices.filter((i) => i.status === "PAID");
  const unpaidInvoices = allInvoices.filter((i) => i.status !== "PAID");
  const totalPaid = paidInvoices.reduce((s, i) => s + i.total, 0);
  const totalPending = unpaidInvoices.reduce((s, i) => s + i.total, 0);
  const laborRevenue = allInvoices.reduce((s, i) => s + i.laborTotal, 0);
  const partsRevenue = allInvoices.reduce((s, i) => s + i.partsTotal, 0);
  const taxRevenue = allInvoices.reduce((s, i) => s + i.tax, 0);

  const incomeSummary = {
    totalRevenue: Math.round(totalPaid * 100) / 100,
    pendingRevenue: Math.round(totalPending * 100) / 100,
    laborRevenue: Math.round(laborRevenue * 100) / 100,
    partsRevenue: Math.round(partsRevenue * 100) / 100,
    taxRevenue: Math.round(taxRevenue * 100) / 100,
    paidCount: paidInvoices.length,
    unpaidCount: unpaidInvoices.length,
  };

  const serviceHistory = allInvoices.slice(0, 50).map((inv) => {
    const taskServices = Array.isArray(inv.task?.services) ? (inv.task?.services as { name?: string }[]) : [];
    const serviceName = taskServices.length > 0
      ? taskServices.map((s) => s.name).filter(Boolean).join(", ")
      : Array.isArray(inv.items) && (inv.items as { description?: string }[])[0]?.description
        ? (inv.items as { description?: string }[])[0].description!
        : "Vehicle Service";

    const mechanicName = inv.task?.mechanics && inv.task.mechanics.length > 0
      ? inv.task.mechanics.map((m: { name: string }) => m.name).join(", ")
      : inv.task?.mechanic?.name ?? "Unassigned";

    return {
      id: inv.id,
      taskId: inv.taskId,
      date: inv.issuedAt.toISOString(),
      customer: inv.task?.customer?.name ?? "Vehicle Owner",
      vehicle: inv.vehicle ? `${inv.vehicle.year} ${inv.vehicle.make} ${inv.vehicle.model}` : "Vehicle",
      regNo: inv.vehicle?.regNo ?? "—",
      service: serviceName,
      mechanic: mechanicName,
      status: inv.status.toLowerCase(),
      total: Math.round(inv.total * 100) / 100,
    };
  });

  const performanceSummary = {
    completedTasks: tasksByStatus.find((j) => j.status === "COMPLETED")?._count ?? 0,
    avgRating: ratingsStats._avg.score ? Number(ratingsStats._avg.score.toFixed(1)) : 5.0,
    totalRatingsCount: ratingsStats._count,
  };

  return {
    ...stats,
    activeTasks: stats.activeTasks,
    revenueByMonth: stats.revenueByMonth,
    tasksByStatus: mappedStatus,
    workloadByMechanic: mechanics.map((m) => ({
      mechanic: m.name,
      role: m.specialization ?? "Technician",
      active: activeByMechanic[m.id] ?? 0,
      completed: completedByMechanic[m.id] ?? 0,
    })),
    serviceDistribution,
    activityLog: activityLog.map((a) => ({ id: a.id, user: a.user, action: a.action, time: a.time })),
    incomeSummary,
    serviceHistory,
    performanceSummary,
  };
}

function listAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { time: "desc" }, take: 50 });
}

async function getDashboardStats() {
  const [activeTasks, totalRevenue, revenueByMonthRaw, customers, employees] = await Promise.all([
    prisma.taskCard.count({ where: { status: { notIn: ["COMPLETED", "READY"] } } }),
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
    activeTasks,
    registeredCustomers: customers,
    activeEmployees: employees,
    revenueByMonth,
  };
}

