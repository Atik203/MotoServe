import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { logAudit } from "../../lib/audit.js";
import { assignMechanic, createCustomer, createEstimate, createTaskCard } from "./advisor.service.js";
import type { AssignMechanicBody, CreateCustomerBody, CreateEstimateBody, CreateTaskCardBody } from "./advisor.types.js";

export async function createTaskCardController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const task = await createTaskCard(req.user.userId, req.body.body as CreateTaskCardBody);
  await logAudit(req.user.name, `Created task card ${task.id}`);
  res.status(201).json({ id: task.id });
}
export const createJobCardController = createTaskCardController;

export async function createCustomerController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const customer = await createCustomer(req.body.body as CreateCustomerBody);
  await logAudit(req.user.name, `Registered walk-in customer ${customer.name}`);
  res.status(201).json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    nid: customer.nid,
    status: customer.status.toLowerCase(),
    joinedAt: customer.joinedAt,
  });
}

export async function assignMechanicController(req: Request, res: Response): Promise<void> {
  const task = await assignMechanic(req.params.id as string, req.body.body as AssignMechanicBody);
  await logAudit(req.user?.name ?? "advisor", `Assigned mechanic to ${task.id}`);
  res.json(task);
}

export async function createEstimateController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const estimate = await createEstimate(req.user.userId, req.user.role, req.body.body as CreateEstimateBody);
  await logAudit(req.user.name, `Sent estimate ${estimate.id}`);
  res.status(201).json(estimate);
}

