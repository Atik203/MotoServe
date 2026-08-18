import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  bookAppointmentController,
  createThreadController,
  createVehicleController,
  decideEstimateController,
  deleteVehicleController,
  payInvoiceController,
  rateJobController,
  updateVehicleController,
} from "./owner.controller.js";
import {
  bookAppointmentSchema,
  createThreadSchema,
  createVehicleSchema,
  decideEstimateSchema,
  payInvoiceSchema,
  rateJobSchema,
  updateVehicleSchema,
} from "./owner.validation.js";

export const router = Router();

router.post("/vehicles", requireAuth, requireRole("owner", "advisor", "admin"), validate(createVehicleSchema), createVehicleController);
router.patch("/vehicles/:id", requireAuth, requireRole("owner"), validate(updateVehicleSchema), updateVehicleController);
router.delete("/vehicles/:id", requireAuth, requireRole("owner"), deleteVehicleController);

router.post("/appointments", requireAuth, requireRole("owner"), validate(bookAppointmentSchema), bookAppointmentController);

router.patch("/estimates/:id/decide", requireAuth, requireRole("owner"), validate(decideEstimateSchema), decideEstimateController);

router.post("/invoices/:id/pay", requireAuth, requireRole("owner"), validate(payInvoiceSchema), payInvoiceController);

router.post("/jobs/:id/rate", requireAuth, requireRole("owner"), validate(rateJobSchema), rateJobController);

router.post("/chat/threads", requireAuth, requireRole("owner"), validate(createThreadSchema), createThreadController);
