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

