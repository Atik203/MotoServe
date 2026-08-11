import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
  }),
});

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

export const updateServiceSchema = createServiceSchema.partial();

export const createVehicleSchema = z.object({
  body: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1950).max(2100),
    regNo: z.string().min(2),
    fuelType: z.enum(["gasoline", "diesel", "hybrid", "electric"]),
    mileage: z.number().int().nonnegative(),
    vin: z.string().optional(),
    color: z.string().optional(),
    transmission: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const bookAppointmentSchema = z.object({
  body: z.object({
    vehicleId: z.string(),
    serviceIds: z.array(z.string()).min(1),
    date: z.string(),
    time: z.string(),
    notes: z.string().optional(),
  }),
});

export const createJobCardSchema = z.object({
  body: z.object({
    vehicleId: z.string(),
    customerId: z.string(),
    advisorId: z.string(),
    issues: z.string().min(1),
    priority: z.enum(["low", "medium", "high"]).optional(),
    station: z.string().optional(),
  }),
});

export const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.enum(["received", "inspecting", "repairing", "testing", "ready", "completed"]),
  }),
});

export const addJobNoteSchema = z.object({
  body: z.object({
    author: z.string(),
    time: z.string().optional(),
    text: z.string().min(1),
  }),
});

export const addPartUsedSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    qty: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    supplier: z.string(),
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

export const decideEstimateSchema = z.object({
  body: z.object({
    decision: z.enum(["approved", "rejected"]),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    threadId: z.string(),
    text: z.string().min(1),
  }),
});

export const createThreadSchema = z.object({
  body: z.object({
    advisorId: z.string(),
    subject: z.string().optional(),
    text: z.string().min(1),
  }),
});
