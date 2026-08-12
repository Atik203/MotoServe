import { z } from "zod";

export const presignUploadSchema = z.object({
  body: z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
    purpose: z.enum(["document", "image"]),
  }),
});

export const presignGetSchema = z.object({
  body: z.object({
    key: z.string().min(1),
  }),
});
