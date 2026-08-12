import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    threadId: z.string(),
    text: z.string().min(1),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    status: z.enum(["confirmed", "cancelled"]),
  }),
});
