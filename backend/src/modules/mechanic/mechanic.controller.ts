import type { Request, Response } from "express";
import { logAudit } from "../../lib/audit.js";
import { addJobNote, addJobPhoto, addPartUsed, updateJobStatus } from "./mechanic.service.js";
import type { AddJobNoteBody, AddPartUsedBody, UpdateJobStatusBody } from "./mechanic.types.js";

export async function updateJobStatusController(req: Request, res: Response): Promise<void> {
  const { status } = req.body.body as UpdateJobStatusBody;
  const job = await updateJobStatus(req.params.id as string, status);
  if (job.status === "COMPLETED") {
    await logAudit(req.user?.name ?? "mechanic", `Completed job ${job.id}`);
  } else {
    await logAudit(req.user?.name ?? "mechanic", `Moved job ${job.id} to ${job.status}`);
  }
  res.json({ id: job.id, status: job.status.toLowerCase() });
}

export async function addJobNoteController(req: Request, res: Response): Promise<void> {
  const note = await addJobNote(req.params.id as string, req.body.body as AddJobNoteBody);
  res.status(201).json(note);
}

export async function addPartUsedController(req: Request, res: Response): Promise<void> {
  const part = await addPartUsed(req.params.id as string, req.body.body as AddPartUsedBody);
  res.status(201).json(part);
}

export async function addJobPhotoController(req: Request, res: Response): Promise<void> {
  const { key } = req.body.body as { key: string };
  const job = await addJobPhoto(req.params.id as string, key);
  res.status(201).json({ photos: job.photos });
}
