import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createServiceController,
  deleteServiceController,
  getReports,
  updateServiceController,
  verifyOwner,
} from "./admin.controller.js";
import { createServiceSchema, updateServiceSchema, verifyOwnerSchema } from "./admin.validation.js";

export const router = Router();

router.post("/services", requireAuth, requireRole("admin"), validate(createServiceSchema), createServiceController);
router.patch("/services/:id", requireAuth, requireRole("admin"), validate(updateServiceSchema), updateServiceController);
router.delete("/services/:id", requireAuth, requireRole("admin"), deleteServiceController);

router.patch("/customers/:id/verify", requireAuth, requireRole("admin"), validate(verifyOwnerSchema), verifyOwner);

router.get("/reports", requireAuth, requireRole("admin", "advisor"), getReports);
