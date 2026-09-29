import { test, expect } from "@playwright/test";
import { newApiContext } from "../helpers/api";

test.describe("guests (public, unauthenticated)", () => {
  test("can browse the service list with prices", async ({ playwright }) => {
    const guest = await newApiContext(playwright);
    const res = await guest.get("/services");
    expect(res.ok(), await res.text()).toBeTruthy();

    const services = (await res.json()) as { id: string; name: string; basePrice: number; durationMins: number }[];
    expect(services.length).toBeGreaterThan(0);
    for (const service of services.slice(0, 5)) {
      expect(typeof service.name).toBe("string");
      expect(typeof service.basePrice).toBe("number");
      expect(typeof service.durationMins).toBe("number");
    }
  });

  test("can read public site content and workshop info", async ({ playwright }) => {
    const guest = await newApiContext(playwright);

    for (const key of ["home", "services", "pricing", "faqs", "testimonials"]) {
      const res = await guest.get(`/content/${key}`);
      expect(res.ok(), `/content/${key} should be public`).toBeTruthy();
      const body = (await res.json()) as { data?: unknown };
      expect(body.data, `/content/${key} should return data`).toBeTruthy();
    }

    const testimonials = await guest.get("/testimonials");
    expect(testimonials.ok()).toBeTruthy();
    expect(Array.isArray(await testimonials.json())).toBe(true);

    const health = await guest.get("/health");
    expect(health.ok()).toBeTruthy();
    expect(((await health.json()) as { status: string }).status).toBe("ok");
  });

  test("cannot reach role-protected endpoints", async ({ playwright }) => {
    const guest = await newApiContext(playwright);
    expect((await guest.get("/tasks")).status()).toBe(401);
    expect((await guest.get("/invoices")).status()).toBe(401);
    expect((await guest.get("/customers")).status()).toBe(401);
    expect((await guest.get("/reports")).status()).toBe(401);
  });
});
