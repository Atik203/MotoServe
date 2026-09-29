import { test, expect } from "@playwright/test";
import { ACCOUNTS, apiAs, newApiContext } from "../helpers/api";

test.describe("auth", () => {
  for (const role of ["owner", "advisor", "mechanic", "admin"] as const) {
    test(`logs in as ${role} and resolves the session`, async ({ playwright }) => {
      const session = await apiAs(playwright, role);
      expect(session.token).toBeTruthy();
      expect(session.user.role).toBe(role);

      const me = await session.ctx.get("/auth/me", { headers: session.headers });
      expect(me.ok()).toBeTruthy();
      const body = (await me.json()) as { role: string };
      expect(body.role).toBe(role);
    });
  }

  test("rejects invalid credentials", async ({ playwright }) => {
    const ctx = await newApiContext(playwright);
    const res = await ctx.post("/auth/login", {
      data: { email: ACCOUNTS.owner.email, password: "definitely-wrong" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects unauthenticated access to protected endpoints", async ({ playwright }) => {
    const ctx = await newApiContext(playwright);
    expect((await ctx.get("/tasks")).status()).toBe(401);
    expect((await ctx.get("/appointments")).status()).toBe(401);
  });

  test("enforces role restrictions", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const res = await owner.ctx.post("/tasks", {
      headers: owner.headers,
      data: { vehicleId: "x", customerId: owner.user.id, issues: "nope" },
    });
    expect(res.status()).toBe(403);
  });
});
