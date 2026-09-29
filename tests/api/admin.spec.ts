import { test, expect } from "@playwright/test";
import { apiAs, loginUser } from "../helpers/api";

test.describe("admin", () => {
  test("adds a service type with a base price and manages it", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const name = `E2E Service ${Date.now()}`;

    const created = await admin.ctx.post("/services", {
      headers: admin.headers,
      data: {
        name,
        category: "maintenance",
        basePrice: 59.5,
        durationMins: 30,
        description: "Added by the e2e suite",
        laborRate: 42,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const service = (await created.json()) as { id: string; name: string; basePrice: number; category: string };
    expect(service.name).toBe(name);
    expect(service.basePrice).toBe(59.5);

    // The public catalogue exposes the new service with its price.
    const publicList = (await (await admin.ctx.get("/services")).json()) as {
      id: string;
      basePrice: number;
      category: string;
    }[];
    const listed = publicList.find((s) => s.id === service.id);
    expect(listed, "new service should appear in the public catalogue").toBeTruthy();
    expect(listed!.basePrice).toBe(59.5);
    expect(listed!.category).toBe("maintenance");

    const patched = await admin.ctx.patch(`/services/${service.id}`, {
      headers: admin.headers,
      data: { basePrice: 69.99 },
    });
    expect(patched.ok(), await patched.text()).toBeTruthy();
    expect(((await patched.json()) as { basePrice: number }).basePrice).toBe(69.99);

    const removed = await admin.ctx.delete(`/services/${service.id}`, { headers: admin.headers });
    expect(removed.ok()).toBeTruthy();
    const afterDelete = (await (await admin.ctx.get("/services")).json()) as { id: string }[];
    expect(afterDelete.some((s) => s.id === service.id)).toBe(false);
  });

  test("adds service advisors and mechanics who can then log in", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const stamp = Date.now();

    for (const role of ["advisor", "mechanic"] as const) {
      const email = `e2e-${role}-${stamp}@example.com`;
      const res = await admin.ctx.post("/employees", {
        headers: admin.headers,
        data: {
          name: `E2E ${role}`,
          email,
          password: "password123",
          role,
          phone: "+1 (555) 010-2030",
          station: "Main Bay / Station 01",
          specialization: role === "mechanic" ? "Engine & Diagnostics" : undefined,
          skills: role === "mechanic" ? ["Diagnostics", "Oil Change"] : undefined,
        },
      });
      expect(res.status(), await res.text()).toBe(201);
      const employee = (await res.json()) as { id: string; role: string; status: string; skills?: string[] };
      expect(employee.role).toBe(role);
      expect(employee.status).toBe("active");
      if (role === "mechanic") expect(employee.skills).toEqual(["Diagnostics", "Oil Change"]);

      const duplicate = await admin.ctx.post("/employees", {
        headers: admin.headers,
        data: { name: "Duplicate", email, password: "password123", role },
      });
      expect(duplicate.status()).toBe(409);

      const login = await loginUser(playwright, email, "password123");
      expect(login.user.role, `new ${role} should be able to log in`).toBe(role);

      const deactivated = await admin.ctx.delete(`/employees/${employee.id}`, { headers: admin.headers });
      expect(deactivated.ok(), `deactivate ${role} failed: ${deactivated.status()} ${await deactivated.text()}`).toBeTruthy();
      const employees = (await (await admin.ctx.get("/employees", { headers: admin.headers })).json()) as {
        id: string;
        status: string;
      }[];
      expect(employees.find((e) => e.id === employee.id)?.status).toBe("inactive");
    }
  });

  test("generates income and workload reports", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const res = await admin.ctx.get("/reports", { headers: admin.headers });
    expect(res.ok(), await res.text()).toBeTruthy();
    const report = (await res.json()) as Record<string, unknown> & {
      incomeSummary?: { totalRevenue: number; laborRevenue: number; partsRevenue: number; taxRevenue: number };
    };

    expect(typeof report.totalRevenue).toBe("number");
    expect(typeof report.registeredCustomers).toBe("number");
    expect(typeof report.activeEmployees).toBe("number");
    expect(Array.isArray(report.revenueByMonth)).toBe(true);
    expect(Array.isArray(report.workloadByMechanic)).toBe(true);
    expect(Array.isArray(report.serviceDistribution)).toBe(true);
    expect(Array.isArray(report.activityLog)).toBe(true);
    expect(report.incomeSummary).toBeTruthy();
    expect(typeof report.incomeSummary!.totalRevenue).toBe("number");
    expect(typeof report.incomeSummary!.laborRevenue).toBe("number");
    expect(report.performanceSummary).toBeTruthy();
  });
});
