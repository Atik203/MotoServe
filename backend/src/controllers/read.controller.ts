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

export async function getCustomers(_req: Request, res: Response): Promise<void> {
  const customers = await listCustomers();
  res.json(customers.map((c) => ({ ...c, status: c.status.toLowerCase() })));
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
  const [stats, jobsByStatus, workloadByMechanic, activityLog] = await Promise.all([
    getDashboardStats(),
    prisma.jobCard.groupBy({ by: ["status"], _count: true }),
    prisma.user.findMany({
      where: { role: "MECHANIC" },
      include: { _count: { select: { jobCardsAssigned: true } } },
    }),
    listAuditLogsSafe(),
  ]);
  res.json({
    ...stats,
    jobsByStatus: jobsByStatus.map((j) => ({ status: j.status.toLowerCase(), count: j._count })),
    workloadByMechanic: workloadByMechanic.map((m) => ({
      mechanic: m.name,
      active: m._count.jobCardsAssigned,
      specialization: m.specialization,
    })),
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
  res.json({ id: user.id, status: user.status.toLowerCase() });
}
