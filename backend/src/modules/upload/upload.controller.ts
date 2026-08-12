import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import { presignDocumentUpload, presignImageUpload, presignRead } from "./upload.service.js";

export async function presignUploadController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const { fileName, fileType, purpose } = req.body.body as { fileName: string; fileType: string; purpose: "document" | "image" };
  const result =
    purpose === "document"
      ? await presignDocumentUpload(req.user.userId, fileName, fileType)
      : await presignImageUpload(req.user.userId, fileName, fileType);
  res.json(result);
}

export async function presignGetController(req: Request, res: Response): Promise<void> {
  const { key } = req.body.body as { key: string };
  const url = await presignRead(key);
  res.json({ url });
}
