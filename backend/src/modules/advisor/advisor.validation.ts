import { z } from "zod";

export const createJobCardSchema = z.object({
  body: z.object({
    vehicleId: z.string(),
    customerId: z.string(),
    issues: z.string().min(1),
    priority: z.enum(["low", "medium", "high"]).optional(),
    station: z.string().optional(),
    mileage: z.number().int().nonnegative().optional(),
    fuelLevel: z.number().int().min(0).max(100).optional(),
    keysReceived: z.boolean().optional(),
    accessories: z.string().optional(),
    appointmentId: z.string().optional(),
    serviceIds: z.array(z.string()).optional(),
    expectedDate: z.string().optional(),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().or(z.string().max(0).optional()),
    nid: z.string().optional(),
    occupation: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
});

export const assignMechanicSchema = z.object({
  body: z.object({
    mechanicId: z.string(),
    station: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const createEstimateSchema = z.object({
  body: z.object({
    jobId: z.string(),
    summary: z.string().optional(),
    internalNotes: z.string().optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1),
          category: z.enum(["service", "parts", "labor"]),
          amount: z.number().nonnegative(),
        }),
      )
      .min(1),
  }),
});
