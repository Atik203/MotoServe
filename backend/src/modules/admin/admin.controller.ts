import type { Request, Response } from "express";
import { mapCustomerStatus } from "../shared/shared.service.js";
import {
  createEmployee,
  createService,
  deactivateEmployee,
  deleteService,
  getReportData,
  updateEmployee,
  updateService,
  verifyCustomerStatus,
} from "./admin.service.js";
import type { CreateEmployeeBody, CreateServiceBody, UpdateEmployeeBody } from "./admin.types.js";

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

export async function createEmployeeController(req: Request, res: Response): Promise<void> {
  const employee = await createEmployee(req.body.body as CreateEmployeeBody);
  res.status(201).json({ ...employee, role: employee.role.toLowerCase(), status: employee.status.toLowerCase() });
}

export async function updateEmployeeController(req: Request, res: Response): Promise<void> {
  const employee = await updateEmployee(req.params.id as string, req.body.body as UpdateEmployeeBody);
  res.json({ ...employee, role: employee.role.toLowerCase(), status: employee.status.toLowerCase() });
}

export async function deleteEmployeeController(req: Request, res: Response): Promise<void> {
  await deactivateEmployee(req.params.id as string);
  res.json({ ok: true });
}

export async function getReports(_req: Request, res: Response): Promise<void> {
  res.json(await getReportData());
}
