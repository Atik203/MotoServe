import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  bookAppointmentController,
  createThreadController,
  createVehicleController,
  decideEstimateController,
  payInvoiceController,
  rateJobController,
} from "./owner.controller.js";
import {
  bookAppointmentSchema,
  createThreadSchema,
  createVehicleSchema,
  decideEstimateSchema,
  payInvoiceSchema,
  rateJobSchema,
} from "./owner.validation.js";

export const router = Router();

router.post("/vehicles", requireAuth, requireRole("owner"), validate(createVehicleSchema), createVehicleController);

router.post("/appointments", requireAuth, requireRole("owner"), validate(bookAppointmentSchema), bookAppointmentController);

router.patch("/estimates/:id/decide", requireAuth, requireRole("owner"), validate(decideEstimateSchema), decideEstimateController);

router.post("/invoices/:id/pay", requireAuth, requireRole("owner"), validate(payInvoiceSchema), payInvoiceController);

router.post("/jobs/:id/rate", requireAuth, requireRole("owner"), validate(rateJobSchema), rateJobController);

router.post("/chat/threads", requireAuth, requireRole("owner"), validate(createThreadSchema), createThreadController);
