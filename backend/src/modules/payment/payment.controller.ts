import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { createCheckoutSession } from "./payment.service.js";

export async function createCheckoutController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { invoiceId } = req.body.body as { invoiceId: string };
  const url = await createCheckoutSession(req.user.userId, invoiceId);
  res.json({ url });
}
