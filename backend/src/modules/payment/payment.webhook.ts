import type { Request, Response } from "express";
import { Router } from "express";
import { ApiError } from "../../middleware/error.js";
import { stripe } from "./stripe.client.js";
import { handleCheckoutCompleted } from "./payment.service.js";

export const webhookRouter = Router();

webhookRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    throw new ApiError(400, "Missing Stripe signature or webhook secret");
  }
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch {
    throw new ApiError(400, "Invalid Stripe signature");
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object);
  }

  res.json({ received: true });
});
