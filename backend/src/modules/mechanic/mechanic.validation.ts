import { z } from "zod";

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
    qty: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    supplier: z.string().min(1),
  }),
});

export const addJobPhotoSchema = z.object({
  body: z.object({
    key: z.string().min(1),
  }),
});
