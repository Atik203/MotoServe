import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { presignDocumentUpload, presignImageUpload, presignRead } from "./upload.service.js";

export async function presignUploadController(req: Request, res: Response): Promise<void> {
  const { fileName, fileType, purpose } = req.body.body as { fileName: string; fileType: string; purpose: "document" | "image" };
  const folderId = req.user?.userId ?? `anon-${randomUUID()}`;
  const result =
    purpose === "document"
      ? await presignDocumentUpload(folderId, fileName, fileType)
      : await presignImageUpload(folderId, fileName, fileType);
  res.json(result);
}

export async function presignGetController(req: Request, res: Response): Promise<void> {
  const { key } = req.body.body as { key: string };
  const url = await presignRead(key);
  res.json({ url });
}
