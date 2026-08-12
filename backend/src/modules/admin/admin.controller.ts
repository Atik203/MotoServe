import type { Request, Response } from "express";
import { mapCustomerStatus } from "../shared/shared.service.js";
import {
  createService,
  deleteService,
  getReportData,
  updateService,
  verifyCustomerStatus,
} from "./admin.service.js";
import type { CreateServiceBody } from "./admin.types.js";

export async function createServiceController(req: Request, res: Response): Promise<void> {
  const body = req.body.body as CreateServiceBody;
  const service = await createService(body);
  res.status(201).json({ ...service, category: service.category.toLowerCase() });
}

export async function updateServiceController(req: Request, res: Response): Promise<void> {
  const body = req.body.body as Record<string, unknown>;
  const service = await updateService(req.params.id as string, body);
  res.json({ ...service, category: service.category.toLowerCase() });
}

export async function deleteServiceController(req: Request, res: Response): Promise<void> {
  await deleteService(req.params.id as string);
  res.json({ ok: true });
}

export async function verifyOwner(req: Request, res: Response): Promise<void> {
  const { decision } = req.body.body as { decision: "approved" | "rejected" };
  const user = await verifyCustomerStatus(req.params.id as string, decision);
  res.json({ id: user.id, status: mapCustomerStatus(user.status) });
}

export async function getReports(_req: Request, res: Response): Promise<void> {
  res.json(await getReportData());
}
