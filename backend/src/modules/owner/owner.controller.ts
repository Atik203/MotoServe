import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { getIo } from "../../lib/socket.js";
import {
  bookAppointment,
  createChatThread,
  createVehicle,
  decideEstimate,
  payInvoice,
  rateJob,
} from "./owner.service.js";
import type {
  BookAppointmentBody,
  CreateThreadBody,
  CreateVehicleBody,
  DecideEstimateBody,
  PayInvoiceBody,
  RateJobBody,
} from "./owner.types.js";

export async function createVehicleController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const vehicle = await createVehicle(req.user.userId, req.body.body as CreateVehicleBody);
  res.status(201).json({ ...vehicle, fuelType: vehicle.fuelType.toLowerCase() });
}

export async function bookAppointmentController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const appointment = await bookAppointment(req.user.userId, req.body.body as BookAppointmentBody);
  res.status(201).json({ ...appointment, status: appointment.status.toLowerCase() });
}

export async function decideEstimateController(req: Request, res: Response): Promise<void> {
  const { decision } = req.body.body as DecideEstimateBody;
  const estimate = await decideEstimate(req.params.id as string, decision);
  res.json({ id: estimate.id, status: estimate.status.toLowerCase() });
}

export async function payInvoiceController(req: Request, res: Response): Promise<void> {
  const { method } = req.body.body as PayInvoiceBody;
  const invoice = await payInvoice(req.params.id as string, method);
  res.json({ id: invoice.id, status: "paid" });
}

export async function rateJobController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const rating = await rateJob(req.params.id as string, req.user.userId, req.body.body as RateJobBody);
  res.status(201).json(rating);
}

export async function createThreadController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { advisorId, subject, text } = req.body.body as CreateThreadBody;
  const thread = await createChatThread(req.user.userId, advisorId, subject, text);
  getIo().to(`user:${advisorId}`).emit("thread:new", { id: thread.id, ownerId: thread.ownerId, subject: thread.subject });
  res.status(201).json(thread);
}
