import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  archiveTaskController,
  bookAppointmentController,
  bulkArchiveTasksController,
  createVehicleController,
  decideEstimateController,
  deleteRatingController,
  deleteVehicleController,
  payInvoiceController,
  rateTaskController,
  restoreTaskController,
  updateVehicleController,
} from "./owner.controller.js";
import {
  bookAppointmentSchema,
  bulkArchiveTasksSchema,
  createVehicleSchema,
  decideEstimateSchema,
  payInvoiceSchema,
  rateTaskSchema,
  updateVehicleSchema,
} from "./owner.validation.js";

export const router = Router();

router.post("/vehicles", requireAuth, requireRole("owner", "advisor", "admin"), validate(createVehicleSchema), createVehicleController);
router.patch("/vehicles/:id", requireAuth, requireRole("owner"), validate(updateVehicleSchema), updateVehicleController);
router.delete("/vehicles/:id", requireAuth, requireRole("owner"), deleteVehicleController);

router.post("/appointments", requireAuth, requireRole("owner", "advisor", "admin"), validate(bookAppointmentSchema), bookAppointmentController);

router.patch("/estimates/:id/decide", requireAuth, requireRole("owner"), validate(decideEstimateSchema), decideEstimateController);

router.post("/invoices/:id/pay", requireAuth, requireRole("owner"), validate(payInvoiceSchema), payInvoiceController);

router.post("/tasks/:id/rate", requireAuth, requireRole("owner"), validate(rateTaskSchema), rateTaskController);

router.delete("/tasks/:id/rate", requireAuth, requireRole("owner"), deleteRatingController);

router.patch("/tasks/:id/archive", requireAuth, requireRole("owner"), archiveTaskController);

router.patch("/tasks/:id/restore", requireAuth, requireRole("owner"), restoreTaskController);

router.post("/tasks/archive", requireAuth, requireRole("owner"), validate(bulkArchiveTasksSchema), bulkArchiveTasksController);

