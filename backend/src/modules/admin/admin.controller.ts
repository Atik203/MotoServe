import type { Request, Response } from "express";
import { mapCustomerStatus } from "../shared/shared.service.js";
import { logAudit } from "../../lib/audit.js";
import {
  createEmployee,
  createService,
  deleteCustomer,
  deleteEmployee,
  deleteService,
  getEmployeeDeletionImpact,
  getReportData,
  updateEmployee,
  updateService,
  verifyCustomerStatus,
} from "./admin.service.js";
import type { CreateEmployeeBody, CreateServiceBody, UpdateEmployeeBody } from "./admin.types.js";

export async function createServiceController(req: Request, res: Response): Promise<void> {
  const body = req.body.body as CreateServiceBody;
  const service = await createService(body);
  await logAudit(req.user?.name ?? "admin", `Created service "${service.name}"`);
  res.status(201).json({ ...service, category: service.category.toLowerCase() });
}

export async function updateServiceController(req: Request, res: Response): Promise<void> {
  const body = req.body.body as Record<string, unknown>;
  const service = await updateService(req.params.id as string, body);
  await logAudit(req.user?.name ?? "admin", `Updated service "${service.name}"`);
  res.json({ ...service, category: service.category.toLowerCase() });
}

export async function deleteServiceController(req: Request, res: Response): Promise<void> {
  const service = await deleteService(req.params.id as string);
  await logAudit(req.user?.name ?? "admin", `Deleted service "${service.name}"`);
  res.json({ ok: true });
}

export async function verifyOwner(req: Request, res: Response): Promise<void> {
  const { decision } = req.body.body as { decision: "approved" | "rejected" };
  const user = await verifyCustomerStatus(req.params.id as string, decision);
  await logAudit(req.user?.name ?? "admin", `${decision === "approved" ? "Approved" : "Rejected"} owner ${user.name}`);
  res.json({ id: user.id, status: mapCustomerStatus(user.status) });
}

export async function deleteCustomerController(req: Request, res: Response): Promise<void> {
  const result = await deleteCustomer(req.params.id as string, req.user?.userId ?? "");
  await logAudit(
    req.user?.name ?? "admin",
    `Deleted customer account "${result.user.name}" (${result.vehicles} vehicle(s), ${result.tasks} job card(s), ${result.filesDeleted} file(s) removed)`,
  );
  res.json({ ok: true });
}

export async function createEmployeeController(req: Request, res: Response): Promise<void> {
  const employee = await createEmployee(req.body.body as CreateEmployeeBody);
  await logAudit(req.user?.name ?? "admin", `Created ${employee.role.toLowerCase()} "${employee.name}"`);
  res.status(201).json({ ...employee, role: employee.role.toLowerCase(), status: employee.status.toLowerCase() });
}

export async function updateEmployeeController(req: Request, res: Response): Promise<void> {
  const employee = await updateEmployee(req.params.id as string, req.body.body as UpdateEmployeeBody);
  await logAudit(req.user?.name ?? "admin", `Updated ${employee.role.toLowerCase()} "${employee.name}"`);
  res.json({ ...employee, role: employee.role.toLowerCase(), status: employee.status.toLowerCase() });
}

export async function getEmployeeDeletionImpactController(req: Request, res: Response): Promise<void> {
  res.json(await getEmployeeDeletionImpact(req.params.id as string));
}

export async function deleteEmployeeController(req: Request, res: Response): Promise<void> {
  const replacementAdvisorId =
    typeof req.query.replacementAdvisorId === "string" ? req.query.replacementAdvisorId : undefined;
  const result = await deleteEmployee(req.params.id as string, req.user?.userId ?? "", replacementAdvisorId);
  const detail =
    result.role === "mechanic"
      ? `unassigned ${result.unassignedTasks} job card(s), removed ${result.removedPartRequests} part request(s)`
      : `reassigned ${result.reassignedTasks} job card(s) and ${result.reassignedChats} chat(s)${result.replacementName ? ` to ${result.replacementName}` : ""}`;
  await logAudit(
    req.user?.name ?? "admin",
    `Deleted ${result.role} "${result.name}" (${detail}, ${result.filesDeleted} file(s) removed)`,
  );
  res.json({ ok: true, ...result });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const { from, to, station, mechanicId, service, status } = req.query;
  res.json(
    await getReportData({
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
      station: typeof station === "string" ? station : undefined,
      mechanicId: typeof mechanicId === "string" ? mechanicId : undefined,
      service: typeof service === "string" ? service : undefined,
      status: typeof status === "string" ? status : undefined,
    })
  );
}
