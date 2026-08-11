import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middleware/error.js";

export async function createService(req: Request, res: Response): Promise<void> {
  const body = req.body.body;
  const service = await prisma.service.create({
    data: { ...body, category: body.category.toUpperCase() },
  });
  res.status(201).json({ ...service, category: service.category.toLowerCase() });
}

export async function updateService(req: Request, res: Response): Promise<void> {
  const body = req.body.body as Record<string, unknown>;
  const service = await prisma.service.update({
    where: { id: req.params.id as string },
    data: body.category ? { ...body, category: String(body.category).toUpperCase() } : body,
  });
  res.json({ ...service, category: service.category.toLowerCase() });
}

export async function deleteService(req: Request, res: Response): Promise<void> {
  await prisma.service.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
}

export async function createVehicle(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const body = req.body.body;
  const vehicle = await prisma.vehicle.create({
    data: { ...body, ownerId: req.user.userId, fuelType: body.fuelType.toUpperCase() },
  });
  res.status(201).json({ ...vehicle, fuelType: vehicle.fuelType.toLowerCase() });
}

export async function bookAppointment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const body = req.body.body;
  const appointment = await prisma.appointment.create({
    data: { ...body, ownerId: req.user.userId, status: "PENDING" },
  });
  res.status(201).json({ ...appointment, status: appointment.status.toLowerCase() });
}

export async function createJobCard(req: Request, res: Response): Promise<void> {
  const body = req.body.body;
  const count = await prisma.jobCard.count();
  const id = `JC-${1040 + count + 1}`;
  const job = await prisma.jobCard.create({
    data: {
      id,
      vehicleId: body.vehicleId,
      customerId: body.customerId,
      advisorId: body.advisorId,
      issues: body.issues,
      priority: (body.priority ?? "medium").toUpperCase(),
      station: body.station,
      status: "RECEIVED",
    },
  });
  await prisma.jobProgress.createMany({
    data: [
      { jobCardId: job.id, step: "RECEIVED", label: "Vehicle Received", done: true },
      { jobCardId: job.id, step: "INSPECTING", label: "Initial Inspection", done: false },
      { jobCardId: job.id, step: "REPAIRING", label: "Repairing", done: false },
      { jobCardId: job.id, step: "TESTING", label: "Testing", done: false },
      { jobCardId: job.id, step: "COMPLETED", label: "Completed", done: false },
    ],
  });
  res.status(201).json({ id: job.id });
}

export async function assignMechanic(req: Request, res: Response): Promise<void> {
  const { mechanicId, station } = req.body.body as { mechanicId: string; station?: string };
  const job = await prisma.jobCard.update({
    where: { id: req.params.id as string },
    data: { mechanicId, station },
  });
  res.json(job);
}

export async function updateJobStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body.body as { status: string };
  const job = await prisma.jobCard.findUniqueOrThrow({ where: { id: req.params.id as string } });
  const order = ["RECEIVED", "INSPECTING", "REPAIRING", "TESTING", "READY", "COMPLETED"];
  const targetIdx = order.indexOf(status.toUpperCase());
  const updated = await prisma.jobCard.update({
    where: { id: job.id },
    data: { status: status.toUpperCase() as never },
  });
  const progress = await prisma.jobProgress.findMany({ where: { jobCardId: job.id } });
  for (const step of progress) {
    const idx = order.indexOf(step.step);
    await prisma.jobProgress.update({
      where: { id: step.id },
      data: { done: idx <= targetIdx, timestamp: idx <= targetIdx && !step.timestamp ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : step.timestamp },
    });
  }
  res.json({ id: updated.id, status: updated.status.toLowerCase() });
}

export async function addJobNote(req: Request, res: Response): Promise<void> {
  const { author, text, time } = req.body.body as { author: string; text: string; time?: string };
  const note = await prisma.jobNote.create({
    data: {
      jobCardId: req.params.id as string,
      author,
      text,
      time: time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  });
  res.status(201).json(note);
}

export async function addPartUsed(req: Request, res: Response): Promise<void> {
  const { name, qty, unitPrice, supplier } = req.body.body as {
    name: string;
    qty: number;
    unitPrice: number;
    supplier: string;
  };
  const part = await prisma.partsUsed.create({
    data: { jobCardId: req.params.id as string, name, qty, unitPrice, supplier, subtotal: qty * unitPrice },
  });
  res.status(201).json(part);
}

export async function createEstimate(req: Request, res: Response): Promise<void> {
  const { jobId, summary, items } = req.body.body as {
    jobId: string;
    summary?: string;
    items: { description: string; category: string; amount: number }[];
  };
  const count = await prisma.estimate.count();
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const estimate = await prisma.estimate.create({
    data: {
      id: `ES-${3300 + count + 1}`,
      jobCardId: jobId,
      customerId: "cus-001",
      advisorId: "emp-001",
      summary: summary ?? "",
      total,
      items: {
        create: items.map((i) => ({
          description: i.description,
          category: i.category.toUpperCase() as never,
          amount: i.amount,
        })),
      },
    },
    include: { items: true },
  });
  res.status(201).json(estimate);
}

export async function decideEstimate(req: Request, res: Response): Promise<void> {
  const { decision } = req.body.body as { decision: string };
  const estimate = await prisma.estimate.update({
    where: { id: req.params.id as string },
    data: { status: decision.toUpperCase() as never },
  });
  res.json({ id: estimate.id, status: estimate.status.toLowerCase() });
}

export async function createThread(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { advisorId, subject, text } = req.body.body as { advisorId: string; subject?: string; text: string };
  const thread = await prisma.chatThread.create({
    data: {
      ownerId: req.user.userId,
      advisorId,
      subject: subject ?? "Vehicle service inquiry",
      messages: { create: { sender: "OWNER", text } },
    },
    include: { messages: true },
  });
  res.status(201).json(thread);
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { threadId, text } = req.body.body as { threadId: string; text: string };
  const sender: "ADVISOR" | "OWNER" = req.user?.role === "OWNER" ? "OWNER" : "ADVISOR";
  const message = await prisma.message.create({ data: { threadId, sender, text } });
  await prisma.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });
  res.status(201).json({ ...message, sender: message.sender.toLowerCase() });
}

export async function payInvoice(req: Request, res: Response): Promise<void> {
  const { method } = req.body.body as { method: "card" | "cash" | "mobile" };
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: req.params.id as string } });
  await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: invoice.id, jobCardId: invoice.jobId, amount: invoice.total, method: method.toUpperCase() as never },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paymentMethod: method.toUpperCase() as never, last4: "4242", paidAt: new Date() },
    }),
  ]);
  res.json({ id: invoice.id, status: "paid" });
}

export async function rateService(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { score, review, serviceName } = req.body.body as { score: number; review: string; serviceName: string };
  const rating = await prisma.rating.create({
    data: { jobId: req.params.id as string, customerId: req.user.userId, score, review, serviceName },
  });
  res.status(201).json(rating);
}
