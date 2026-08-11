import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  findJobById,
  getDashboardStats,
  listAppointments,
  listCustomers,
  listEmployees,
  listEstimates,
  listInvoices,
  listJobs,
  listParts,
  listRatings,
  listServices,
  listTestimonials,
  listThreads,
  listVehicles,
} from "../services/query.service.js";

export async function getServices(_req: Request, res: Response): Promise<void> {
  const services = await listServices();
  res.json(services.map((s) => ({ ...s, category: s.category.toLowerCase() })));
}

export async function getVehicles(req: Request, res: Response): Promise<void> {
  const ownerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const vehicles = await listVehicles(ownerId);
  res.json(vehicles.map((v) => ({ ...v, fuelType: v.fuelType.toLowerCase() })));
}

export async function getJobs(req: Request, res: Response): Promise<void> {
  const jobs = await listJobs(req.user?.role, req.user?.userId);
  res.json(jobs);
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const job = await findJobById(req.params.id as string);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
}

export async function getAppointments(req: Request, res: Response): Promise<void> {
  const ownerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const appointments = await listAppointments(ownerId);
  res.json(appointments.map((a) => ({ ...a, status: a.status.toLowerCase() })));
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const role = req.query.role as string | undefined;
  const employees = await listEmployees(role);
  res.json(employees.map((e) => ({ ...e, role: e.role.toLowerCase(), status: e.status.toLowerCase() })));
}

const mapCustomerStatus = (status: string): string => {
  if (status === "ACTIVE") return "approved";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING") return "pending";
  return "inactive";
};

export async function getCustomers(_req: Request, res: Response): Promise<void> {
  const customers = await listCustomers();
  res.json(customers.map((c) => ({ ...c, status: mapCustomerStatus(c.status) })));
}

export async function getEstimates(req: Request, res: Response): Promise<void> {
  const customerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const estimates = await listEstimates(customerId);
  res.json(
    estimates.map((e) => ({
      ...e,
      status: e.status.toLowerCase(),
      items: e.items.map((i) => ({ ...i, category: i.category.toLowerCase() })),
    })),
  );
}

export async function getInvoices(req: Request, res: Response): Promise<void> {
  const customerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const invoices = await listInvoices(customerId);
  res.json(invoices.map((i) => ({ ...i, status: i.status.toLowerCase() })));
}

export async function getThreads(req: Request, res: Response): Promise<void> {
  const threads = await listThreads(req.user?.role, req.user?.userId);
  res.json(
    threads.map((t) => ({
      id: t.id,
      ownerId: t.ownerId,
      advisorId: t.advisorId,
      subject: t.subject,
      unread: t.unread,
      lastMessageAt: t.lastMessageAt,
      owner: { id: t.owner.id, name: t.owner.name, avatar: t.owner.avatar },
      advisor: { id: t.advisor.id, name: t.advisor.name, avatar: t.advisor.avatar },
      messages: t.messages.map((m) => ({ id: m.id, sender: m.sender.toLowerCase(), text: m.text, time: m.time })),
    })),
  );
}

export async function getParts(_req: Request, res: Response): Promise<void> {
  res.json(await listParts());
}

export async function getRatings(_req: Request, res: Response): Promise<void> {
  res.json(await listRatings());
}

export async function getTestimonials(_req: Request, res: Response): Promise<void> {
  res.json(await listTestimonials());
}

export async function getReports(_req: Request, res: Response): Promise<void> {
  const [stats, jobsByStatus, mechanics, activityLog, jobCards] = await Promise.all([
    getDashboardStats(),
    prisma.jobCard.groupBy({ by: ["status"], _count: true }),
    prisma.user.findMany({
      where: { role: "MECHANIC" },
      include: { _count: { select: { jobCardsAssigned: true } } },
    }),
    listAuditLogsSafe(),
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

  res.json({
    ...stats,
    revenueByMonth: stats.revenueByMonth,
    jobsByStatus: jobsByStatus.map((j) => ({ status: j.status.toLowerCase(), count: j._count })),
    workloadByMechanic: mechanics.map((m) => ({
      mechanic: m.name,
      role: m.specialization ?? "Technician",
      active: m._count.jobCardsAssigned,
      completed: completedByMechanic[m.id] ?? 0,
      avgHoursPerJob: 0,
    })),
    serviceDistribution,
    activityLog: activityLog.map((a) => ({ id: a.id, user: a.user, action: a.action, time: a.time })),
  });
}

async function listAuditLogsSafe() {
  return prisma.auditLog.findMany({ orderBy: { time: "desc" }, take: 50 });
}

export async function verifyOwner(req: Request, res: Response): Promise<void> {
  const { decision } = req.body.body as { decision: string };
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { status: decision === "approved" ? "ACTIVE" : "REJECTED", verifiedAt: decision === "approved" ? new Date() : null },
  });
  res.json({ id: user.id, status: mapCustomerStatus(user.status) });
}
