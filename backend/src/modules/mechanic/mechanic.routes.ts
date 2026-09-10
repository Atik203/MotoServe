import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  addTaskNoteController,
  addTaskPhotoController,
  addPartUsedController,
  updateTaskStatusController,
} from "./mechanic.controller.js";
import { addTaskNoteSchema, addTaskPhotoSchema, addPartUsedSchema, updateTaskStatusSchema } from "./mechanic.validation.js";

export const router = Router();

const statusMiddleware = [
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(updateTaskStatusSchema),
  updateTaskStatusController,
] as const;

router.patch("/tasks/:id/status", ...statusMiddleware);
router.patch("/jobs/:id/status", ...statusMiddleware);

const notesMiddleware = [
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(addTaskNoteSchema),
  addTaskNoteController,
] as const;

router.post("/tasks/:id/notes", ...notesMiddleware);
router.post("/jobs/:id/notes", ...notesMiddleware);

const partsMiddleware = [
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(addPartUsedSchema),
  addPartUsedController,
] as const;

router.post("/tasks/:id/parts", ...partsMiddleware);
router.post("/jobs/:id/parts", ...partsMiddleware);

const photosMiddleware = [
  requireAuth,
  requireRole("mechanic", "advisor", "admin"),
  validate(addTaskPhotoSchema),
  addTaskPhotoController,
] as const;

router.post("/tasks/:id/photos", ...photosMiddleware);
router.post("/jobs/:id/photos", ...photosMiddleware);

