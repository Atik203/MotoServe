import { z } from "zod";

export const createCheckoutSchema = z.object({
  body: z.object({
    invoiceId: z.string().min(1),
  }),
});
