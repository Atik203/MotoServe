import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    threadId: z.string(),
    text: z.string().min(1),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const createThreadSchema = z.object({
  body: z.object({
    advisorId: z.string().min(1).optional(),
    customerId: z.string().min(1).optional(),
    subject: z.string().min(1).max(120).optional(),
    text: z.string().min(1).max(2000),
  }),
});

