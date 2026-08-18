import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { presignGetController, presignUploadController } from "./upload.controller.js";
import { presignGetSchema, presignUploadSchema } from "./upload.validation.js";

export const router = Router();

router.post("/upload/presign", validate(presignUploadSchema), presignUploadController);
router.post("/upload/presign-get", requireAuth, validate(presignGetSchema), presignGetController);
