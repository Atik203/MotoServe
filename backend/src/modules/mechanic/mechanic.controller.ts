import type { Request, Response } from "express";
import { logAudit } from "../../lib/audit.js";
import { addTaskNote, addTaskPhoto, addPartUsed, updateTaskStatus } from "./mechanic.service.js";
import type { AddTaskNoteBody, AddPartUsedBody, UpdateTaskStatusBody } from "./mechanic.types.js";

export async function updateTaskStatusController(req: Request, res: Response): Promise<void> {
  const { status } = req.body.body as UpdateTaskStatusBody;
  const task = await updateTaskStatus(req.params.id as string, status);
  if (task.status === "COMPLETED") {
    await logAudit(req.user?.name ?? "mechanic", `Completed task ${task.id}`);
  } else {
    await logAudit(req.user?.name ?? "mechanic", `Moved task ${task.id} to ${task.status}`);
  }
  res.json({ id: task.id, status: task.status.toLowerCase() });
}
export const updateJobStatusController = updateTaskStatusController;

export async function addTaskNoteController(req: Request, res: Response): Promise<void> {
  const note = await addTaskNote(req.params.id as string, req.body.body as AddTaskNoteBody);
  res.status(201).json(note);
}
export const addJobNoteController = addTaskNoteController;

export async function addPartUsedController(req: Request, res: Response): Promise<void> {
  const part = await addPartUsed(req.params.id as string, req.body.body as AddPartUsedBody);
  res.status(201).json(part);
}

export async function addTaskPhotoController(req: Request, res: Response): Promise<void> {
  const { key } = req.body.body as { key: string };
  const task = await addTaskPhoto(req.params.id as string, key);
  res.status(201).json({ photos: task.photos });
}
export const addJobPhotoController = addTaskPhotoController;

