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
  const ctx = await newApiContext(playwright);
  const res = await ctx.post("/auth/login", { data: ACCOUNTS[role] });
  if (!res.ok()) {
    throw new Error(`Login failed for ${role}: ${res.status()} ${await res.text()}`);
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
