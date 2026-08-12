import { z } from "zod";

export const createJobCardSchema = z.object({
  body: z.object({
    vehicleId: z.string(),
    customerId: z.string(),
    issues: z.string().min(1),
    priority: z.enum(["low", "medium", "high"]).optional(),
    station: z.string().optional(),
  }),
});

export const assignMechanicSchema = z.object({
  body: z.object({
    mechanicId: z.string(),
    station: z.string().optional(),
  }),
});

export const createEstimateSchema = z.object({
  body: z.object({
    jobId: z.string(),
    summary: z.string().optional(),
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
