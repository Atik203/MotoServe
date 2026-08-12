import { z } from "zod";

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

export const decideEstimateSchema = z.object({
  body: z.object({
    decision: z.enum(["approved", "rejected"]),
  }),
});

export const payInvoiceSchema = z.object({
  body: z.object({
    method: z.enum(["card", "cash", "mobile"]),
  }),
});

export const rateJobSchema = z.object({
  body: z.object({
    score: z.number().int().min(1).max(5),
    review: z.string(),
    serviceName: z.string(),
  }),
});

export const createThreadSchema = z.object({
  body: z.object({
    advisorId: z.string(),
    subject: z.string().optional(),
    text: z.string().min(1),
  }),
});
