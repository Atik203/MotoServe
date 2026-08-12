import type { Request, Response } from "express";
import {
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
  findJobById,
  mapCustomerStatus,
  updateAppointment,
} from "./shared.service.js";
import { getIo } from "../../lib/socket.js";
import { prisma } from "../../lib/prisma.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "down" });
  }
}

export async function getServices(_req: Request, res: Response): Promise<void> {
  const services = await listServices();
  res.json(services.map((s) => ({ ...s, category: s.category.toLowerCase() })));
}

export async function getVehicles(req: Request, res: Response): Promise<void> {
  const ownerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const vehicles = await listVehicles(ownerId);
  res.json(vehicles.map((v) => ({ ...v, fuelType: v.fuelType.toLowerCase() })));
}

function mapJob(job: {
  status: string;
  priority: string;
  progress: { step: string }[];
  [key: string]: unknown;
}) {
  return {
    ...job,
    status: job.status.toLowerCase(),
    priority: job.priority.toLowerCase(),
    progress: job.progress.map((p) => ({ ...p, step: p.step.toLowerCase() })),
  };
}

export async function getJobs(req: Request, res: Response): Promise<void> {
  const jobs = await listJobs(req.user?.role, req.user?.userId);
  res.json(jobs.map(mapJob));
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const job = await findJobById(req.params.id as string);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(mapJob(job));
}

export async function getAppointments(req: Request, res: Response): Promise<void> {
  const ownerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  const appointments = await listAppointments(ownerId);
  res.json(appointments.map((a) => ({ ...a, status: a.status.toLowerCase() })));
}

export async function updateAppointmentController(req: Request, res: Response): Promise<void> {
  const { status } = req.body.body as { status: string };
  const appointment = await updateAppointment(
    req.params.id as string,
    status,
    req.user?.role,
    req.user?.userId,
  );
  res.json({ ...appointment, status: appointment.status.toLowerCase() });
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const role = req.query.role as string | undefined;
  const employees = await listEmployees(role);
  res.json(employees.map((e) => ({ ...e, role: e.role.toLowerCase(), status: e.status.toLowerCase() })));
}

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

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { threadId, text } = req.body.body as { threadId: string; text: string };
  const sender: "ADVISOR" | "OWNER" = req.user?.role === "OWNER" ? "OWNER" : "ADVISOR";
  const message = await prisma.message.create({ data: { threadId, sender, text } });
  await prisma.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });
  const payload = { ...message, sender: message.sender.toLowerCase() };
  getIo().to(threadId).emit("message:new", payload);
  res.status(201).json(payload);
}

export async function getParts(_req: Request, res: Response): Promise<void> {
  res.json(await listParts());
}

export async function getRatings(req: Request, res: Response): Promise<void> {
  const customerId = req.user?.role === "OWNER" ? req.user.userId : undefined;
  res.json(await listRatings(customerId));
}

export async function getTestimonials(_req: Request, res: Response): Promise<void> {
  res.json(await listTestimonials());
}
