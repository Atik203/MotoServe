import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { presignGetController, presignUploadController } from "./upload.controller.js";
import { presignGetSchema, presignUploadSchema } from "./upload.validation.js";

export const router = Router();

router.post("/upload/presign", requireAuth, validate(presignUploadSchema), presignUploadController);
router.post("/upload/presign-get", requireAuth, requireRole("admin", "advisor", "mechanic"), validate(presignGetSchema), presignGetController);
