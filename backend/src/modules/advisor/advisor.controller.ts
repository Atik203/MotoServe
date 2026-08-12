import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { assignMechanic, createEstimate, createJobCard } from "./advisor.service.js";
import type { AssignMechanicBody, CreateEstimateBody, CreateJobCardBody } from "./advisor.types.js";

export async function createJobCardController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const job = await createJobCard(req.user.userId, req.body.body as CreateJobCardBody);
  res.status(201).json({ id: job.id });
}

export async function assignMechanicController(req: Request, res: Response): Promise<void> {
  const job = await assignMechanic(req.params.id as string, req.body.body as AssignMechanicBody);
  res.json(job);
}

export async function createEstimateController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const estimate = await createEstimate(req.user.userId, req.body.body as CreateEstimateBody);
  res.status(201).json(estimate);
}
