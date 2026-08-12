import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createCheckoutController } from "./payment.controller.js";
import { createCheckoutSchema } from "./payment.validation.js";

export const router = Router();

router.post("/payments/checkout", requireAuth, requireRole("owner"), validate(createCheckoutSchema), createCheckoutController);
