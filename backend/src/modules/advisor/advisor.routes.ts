import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  assignMechanicController,
  createCustomerController,
  createEstimateController,
  createTaskCardController,
} from "./advisor.controller.js";
import { assignMechanicSchema, createCustomerSchema, createEstimateSchema, createTaskCardSchema } from "./advisor.validation.js";

export const router = Router();

const taskMiddleware = [
  requireAuth,
  requireRole("advisor", "admin"),
  validate(createTaskCardSchema),
  createTaskCardController,
] as const;

router.post("/tasks", ...taskMiddleware);
router.post("/jobs", ...taskMiddleware);

router.post("/customers", requireAuth, requireRole("advisor", "admin"), validate(createCustomerSchema), createCustomerController);

const assignMiddleware = [
  requireAuth,
  requireRole("advisor", "admin"),
  validate(assignMechanicSchema),
  assignMechanicController,
] as const;

router.post("/tasks/:id/assign", ...assignMiddleware);
router.post("/jobs/:id/assign", ...assignMiddleware);

router.post("/estimates", requireAuth, requireRole("advisor", "admin"), validate(createEstimateSchema), createEstimateController);

