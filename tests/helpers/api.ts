import type { APIRequestContext, APIResponse, Playwright } from "@playwright/test";

export const API_ORIGIN = process.env.TEST_API_ORIGIN ?? "http://localhost:4000";
export const API_HEALTH_URL = `${API_ORIGIN}/api/health`;

const API_PREFIX = "/api";

function prefixPath(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith(API_PREFIX)) return url;
  return `${API_PREFIX}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Wraps an APIRequestContext so request paths are resolved under `/api`.
 * Playwright resolves `baseURL` with standard URL rules, so a baseURL of
 * `http://host:4000/api` plus `/auth/login` would drop the `/api` segment.
 */
function apiContext(ctx: APIRequestContext): APIRequestContext {
  const requestMethods = ["get", "post", "patch", "put", "delete", "head", "fetch"];
  return new Proxy(ctx, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      const method = String(prop);
      if (requestMethods.includes(method)) {
        return (url: string, options?: unknown) =>
          (value as (u: string, o?: unknown) => Promise<APIResponse>).call(target, prefixPath(url), options);
      }
      return (value as (...args: unknown[]) => unknown).bind(target);
    },
  });
}

export function newApiContext(playwright: Playwright): Promise<APIRequestContext> {
  return playwright.request.newContext({ baseURL: API_ORIGIN }).then(apiContext);
}

export const ACCOUNTS = {
  admin: { email: "admin@motorserve.com", password: "admin123" },
  advisor: { email: "sarah.jenkins@motorserve.com", password: "password123" },
  mechanic: { email: "alex.turner@motorserve.com", password: "password123" },
  owner: { email: "john.doe@example.com", password: "password123" },
} as const;

export type Role = keyof typeof ACCOUNTS;

export interface ApiSession {
  ctx: APIRequestContext;
  token: string;
  headers: Record<string, string>;
  user: { id: string; name: string; email: string; role: string };
}

export async function apiAs(playwright: Playwright, role: Role): Promise<ApiSession> {
  return loginUser(playwright, ACCOUNTS[role].email, ACCOUNTS[role].password);
}

export async function loginUser(playwright: Playwright, email: string, password: string): Promise<ApiSession> {
  const ctx = await newApiContext(playwright);
  const res = await ctx.post("/auth/login", { data: { email, password } });
  if (!res.ok()) {
    throw new Error(`Login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as ApiSession["user"] & { token: string };
  return {
    ctx,
    token: body.token,
    headers: { Authorization: `Bearer ${body.token}` },
    user: body,
  };
}

export async function firstVehicle(session: ApiSession): Promise<{ id: string; regNo: string }> {
  const res = await session.ctx.get("/vehicles", { headers: session.headers });
  const vehicles = (await res.json()) as { id: string; regNo: string }[];
  if (!vehicles.length) throw new Error("No vehicles available in the test database");
  return vehicles[0];
}

export async function firstService(session: ApiSession): Promise<{ id: string; name: string }> {
  const res = await session.ctx.get("/services");
  const services = (await res.json()) as { id: string; name: string; active: boolean }[];
  const active = services.filter((s) => s.active);
  if (!active.length) throw new Error("No active services available in the test database");
  return active[0];
}

export async function customerWithVehicle(session: ApiSession): Promise<{ customerId: string; vehicleId: string; regNo: string }> {
  const [customersRes, vehiclesRes] = await Promise.all([
    session.ctx.get("/customers", { headers: session.headers }),
    session.ctx.get("/vehicles", { headers: session.headers }),
  ]);
  const customers = (await customersRes.json()) as { id: string }[];
  const vehicles = (await vehiclesRes.json()) as { id: string; ownerId: string; regNo: string }[];
  for (const vehicle of vehicles) {
    if (customers.some((c) => c.id === vehicle.ownerId)) {
      return { customerId: vehicle.ownerId, vehicleId: vehicle.id, regNo: vehicle.regNo };
    }
  }
  throw new Error("No owner with a vehicle found in the test database");
}

export async function activeMechanics(session: ApiSession): Promise<{ id: string; name: string }[]> {
  const res = await session.ctx.get("/employees", { headers: session.headers });
  const employees = (await res.json()) as { id: string; name: string; role: string; status: string }[];
  return employees
    .filter((e) => e.role === "mechanic" && e.status === "active")
    .map((e) => ({ id: e.id, name: e.name }));
}

export interface CreatedTask {
  id: string;
  vehicleId: string;
  customerId: string;
}

export async function createWalkInTask(
  session: ApiSession,
  options: { priority?: string; mechanicIds?: string[]; issues?: string; mileage?: number } = {},
): Promise<CreatedTask> {
  const { customerId, vehicleId } = await customerWithVehicle(session);
  const service = await firstService(session);
  const res = await session.ctx.post("/tasks", {
    headers: session.headers,
    data: {
      vehicleId,
      customerId,
      issues: options.issues ?? "e2e walk-in task",
      priority: options.priority ?? "medium",
      station: "Main Bay / Station 01",
      mileage: options.mileage ?? 25000,
      serviceIds: [service.id],
      mechanicIds: options.mechanicIds,
    },
  });
  if (res.status() !== 201) {
    throw new Error(`createWalkInTask failed: ${res.status()} ${await res.text()}`);
  }
  const { id } = (await res.json()) as { id: string };
  return { id, vehicleId, customerId };
}

export async function advanceTask(session: ApiSession, taskId: string, status: string): Promise<void> {
  const res = await session.ctx.patch(`/tasks/${taskId}/status`, {
    headers: session.headers,
    data: { status },
  });
  if (!res.ok()) throw new Error(`advanceTask(${status}) failed: ${res.status()} ${await res.text()}`);
}

export async function completeTask(session: ApiSession, taskId: string): Promise<void> {
  await advanceTask(session, taskId, "completed");
}

export async function createTaskForOwner(
  advisor: ApiSession,
  ownerId: string,
  options: { priority?: string; mechanicIds?: string[]; issues?: string } = {},
): Promise<CreatedTask> {
  const res = await advisor.ctx.get("/vehicles", { headers: advisor.headers });
  const vehicles = (await res.json()) as { id: string; ownerId: string }[];
  const vehicle = vehicles.find((v) => v.ownerId === ownerId);
  if (!vehicle) throw new Error(`Owner ${ownerId} has no vehicle in the test database`);
  const service = await firstService(advisor);

  const created = await advisor.ctx.post("/tasks", {
    headers: advisor.headers,
    data: {
      vehicleId: vehicle.id,
      customerId: ownerId,
      issues: options.issues ?? "e2e owner task",
      priority: options.priority ?? "medium",
      station: "Main Bay / Station 01",
      mileage: 25000,
      serviceIds: [service.id],
      mechanicIds: options.mechanicIds,
    },
  });
  if (created.status() !== 201) {
    throw new Error(`createTaskForOwner failed: ${created.status()} ${await created.text()}`);
  }
  const { id } = (await created.json()) as { id: string };
  return { id, vehicleId: vehicle.id, customerId: ownerId };
}

export async function invoiceForTask(session: ApiSession, taskId: string) {
  const res = await session.ctx.get("/invoices", { headers: session.headers });
  const invoices = (await res.json()) as {
    id: string;
    taskId: string;
    status: string;
    total: number;
  }[];
  return invoices.find((i) => i.taskId === taskId) ?? null;
}
