import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  addJobNoteController,
  addPartUsedController,
  updateJobStatusController,
} from "./mechanic.controller.js";
import { addJobNoteSchema, addPartUsedSchema, updateJobStatusSchema } from "./mechanic.validation.js";

export const router = Router();

router.patch(
  "/jobs/:id/status",
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(updateJobStatusSchema),
  updateJobStatusController,
);

router.post(
  "/jobs/:id/notes",
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(addJobNoteSchema),
  addJobNoteController,
);

router.post(
  "/jobs/:id/parts",
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(addPartUsedSchema),
  addPartUsedController,
);
