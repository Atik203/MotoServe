import { z } from "zod";

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    category: z.enum(["maintenance", "repairs", "inspections"]),
    basePrice: z.number().nonnegative(),
    durationMins: z.number().int().positive(),
    description: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: createServiceSchema.shape.body.partial(),
});

export const verifyOwnerSchema = z.object({
  body: z.object({
    decision: z.enum(["approved", "rejected"]),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["advisor", "mechanic"]),
    phone: z.string().optional(),
    station: z.string().optional(),
    specialization: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    phone: z.string().optional(),
    station: z.string().optional(),
    specialization: z.string().optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
