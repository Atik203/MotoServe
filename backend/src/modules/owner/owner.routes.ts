import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  archiveJobController,
  bookAppointmentController,
  bulkArchiveJobsController,
  createThreadController,
  createVehicleController,
  decideEstimateController,
  deleteRatingController,
  deleteVehicleController,
  payInvoiceController,
  rateJobController,
  restoreJobController,
  updateVehicleController,
} from "./owner.controller.js";
import {
  bookAppointmentSchema,
  bulkArchiveJobsSchema,
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
router.delete("/jobs/:id/rate", requireAuth, requireRole("owner"), deleteRatingController);

router.patch("/jobs/:id/archive", requireAuth, requireRole("owner"), archiveJobController);
router.patch("/jobs/:id/restore", requireAuth, requireRole("owner"), restoreJobController);
router.post("/jobs/archive", requireAuth, requireRole("owner"), validate(bulkArchiveJobsSchema), bulkArchiveJobsController);

router.post("/chat/threads", requireAuth, requireRole("owner"), validate(createThreadSchema), createThreadController);
