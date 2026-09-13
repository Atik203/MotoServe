import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { safeEmit } from "../../lib/socket.js";
import { logAudit } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import {
  archiveTask,
  bookAppointment,
  bulkArchiveTasks,
  createChatThread,
  createVehicle,
  decideEstimate,
  deleteRating,
  deleteVehicle,
  payInvoice,
  rateTask,
  restoreTask,
  updateVehicle,
} from "./owner.service.js";

import type {
  BookAppointmentBody,
  BulkArchiveTasksBody,
  CreateThreadBody,
  CreateVehicleBody,
  DecideEstimateBody,
  PayInvoiceBody,
  RateTaskBody,
} from "./owner.types.js";

export async function createVehicleController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const body = req.body.body as CreateVehicleBody;
  let ownerId = req.user.userId;
  if (req.user.role !== "OWNER") {
    if (!body.ownerId) throw new ApiError(400, "ownerId is required when staff register a vehicle for a customer");
    const owner = await prisma.user.findUnique({ where: { id: body.ownerId } });
    if (!owner || owner.role !== "OWNER") throw new ApiError(400, "Owner account not found");
    ownerId = body.ownerId;
  }
  const vehicle = await createVehicle(ownerId, body);
  res.status(201).json({ ...vehicle, fuelType: vehicle.fuelType.toLowerCase() });
}

export async function updateVehicleController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const vehicle = await updateVehicle(req.user.userId, req.params.id as string, req.body.body as Partial<CreateVehicleBody>);
  res.json({ ...vehicle, fuelType: vehicle.fuelType.toLowerCase() });
}

export async function deleteVehicleController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  await deleteVehicle(req.user.userId, req.params.id as string);
  res.json({ ok: true });
}

export async function bookAppointmentController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const body = req.body.body as BookAppointmentBody;
  let ownerId = req.user.userId;
  if (req.user.role !== "OWNER") {
    if (body.ownerId) {
      ownerId = body.ownerId;
    } else {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
      if (!vehicle) throw new ApiError(400, "Vehicle not found");
      ownerId = vehicle.ownerId;
    }
  }
  const appointment = await bookAppointment(ownerId, body);
  res.status(201).json({ ...appointment, status: appointment.status.toLowerCase() });
}


export async function decideEstimateController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { decision } = req.body.body as DecideEstimateBody;
  const estimate = await decideEstimate(req.params.id as string, decision, req.user.userId);
  res.json({ id: estimate.id, status: estimate.status.toLowerCase() });
}

export async function payInvoiceController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { method } = req.body.body as PayInvoiceBody;
  const invoice = await payInvoice(req.params.id as string, method, req.user.userId);
  await logAudit(req.user?.name ?? "owner", `Paid invoice ${invoice.id} (${method})`);
  res.json({ id: invoice.id, status: "paid" });
}

export async function rateTaskController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const rating = await rateTask(req.params.id as string, req.user.userId, req.body.body as RateTaskBody);
  res.status(201).json(rating);
}

export async function deleteRatingController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  await deleteRating(req.params.id as string, req.user.userId);
  res.json({ ok: true });
}

export async function archiveTaskController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const task = await archiveTask(req.params.id as string, req.user.userId);
  res.json({ id: task.id, ownerArchivedAt: task.ownerArchivedAt });
}

export async function restoreTaskController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const task = await restoreTask(req.params.id as string, req.user.userId);
  res.json({ id: task.id, ownerArchivedAt: task.ownerArchivedAt });
}

export async function bulkArchiveTasksController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const result = await bulkArchiveTasks((req.body.body as BulkArchiveTasksBody).ids, req.user.userId);
  await logAudit(req.user?.name ?? "owner", `Archived ${result.archived} task(s) from history`);
  res.json(result);
}


export async function createThreadController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { advisorId, subject, text } = req.body.body as CreateThreadBody;
  const thread = await createChatThread(req.user.userId, advisorId, subject, text);
  safeEmit(`user:${advisorId}`, "thread:new", { id: thread.id, ownerId: thread.ownerId, subject: thread.subject });
  res.status(201).json({
    id: thread.id,
    ownerId: thread.ownerId,
    advisorId: thread.advisorId,
    subject: thread.subject,
    unread: 0,
    lastMessageAt: thread.lastMessageAt,
    owner: { id: thread.owner.id, name: thread.owner.name, avatar: thread.owner.avatar },
    advisor: { id: thread.advisor.id, name: thread.advisor.name, avatar: thread.advisor.avatar },
    messages: thread.messages.map((m) => ({ id: m.id, sender: m.sender.toLowerCase(), text: m.text, time: m.time })),
  });
}
