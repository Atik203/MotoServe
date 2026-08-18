import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  assignMechanicController,
  createCustomerController,
  createEstimateController,
  createJobCardController,
} from "./advisor.controller.js";
import { assignMechanicSchema, createCustomerSchema, createEstimateSchema, createJobCardSchema } from "./advisor.validation.js";

export const router = Router();

router.post("/jobs", requireAuth, requireRole("advisor", "admin"), validate(createJobCardSchema), createJobCardController);

router.post("/customers", requireAuth, requireRole("advisor", "admin"), validate(createCustomerSchema), createCustomerController);

router.post("/jobs/:id/assign", requireAuth, requireRole("advisor", "admin"), validate(assignMechanicSchema), assignMechanicController);

router.post("/estimates", requireAuth, requireRole("advisor", "admin"), validate(createEstimateSchema), createEstimateController);
