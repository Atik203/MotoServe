import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createEmployeeController,
  createServiceController,
  deleteEmployeeController,
  deleteServiceController,
  getReports,
  updateEmployeeController,
  updateServiceController,
  verifyOwner,
} from "./admin.controller.js";
import {
  createEmployeeSchema,
  createServiceSchema,
  updateEmployeeSchema,
  updateServiceSchema,
  verifyOwnerSchema,
} from "./admin.validation.js";

export const router = Router();

router.post("/services", requireAuth, requireRole("admin"), validate(createServiceSchema), createServiceController);
router.patch("/services/:id", requireAuth, requireRole("admin"), validate(updateServiceSchema), updateServiceController);
router.delete("/services/:id", requireAuth, requireRole("admin"), deleteServiceController);

router.post("/employees", requireAuth, requireRole("admin"), validate(createEmployeeSchema), createEmployeeController);
router.patch("/employees/:id", requireAuth, requireRole("admin"), validate(updateEmployeeSchema), updateEmployeeController);
router.delete("/employees/:id", requireAuth, requireRole("admin"), deleteEmployeeController);

router.patch("/customers/:id/verify", requireAuth, requireRole("admin"), validate(verifyOwnerSchema), verifyOwner);

router.get("/reports", requireAuth, requireRole("admin", "advisor"), getReports);
