import type { Request, Response } from "express";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COOKIE_NAME, cookieOptions, signToken, verifyToken } from "../../lib/auth.js";
import { ApiError } from "../../middleware/error.js";
import { findUserByEmail, findUserById } from "../shared/shared.service.js";
import { createOwner, updatePassword, updateProfile, verifyCredentials } from "./auth.service.js";
import type { ForgotPasswordBody, RegisterBody, ResetPasswordBody } from "./auth.types.js";

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "uploads");
const ALLOWED_DOC_EXT = [".png", ".jpg", ".jpeg", ".pdf"];

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body.body as { email: string; password: string };
  const user = await verifyCredentials(email, password);
  const token = signToken({ userId: user.id, role: user.role, name: user.name });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role.toLowerCase(), avatar: user.avatar });
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body.body as RegisterBody;
  const user = await createOwner(body);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: "owner", status: user.status });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const user = await findUserById(req.user.userId);
  if (!user) throw new ApiError(404, "User not found");
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    avatar: user.avatar,
    phone: user.phone,
    station: user.station,
    specialization: user.specialization,
  });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body.body as ForgotPasswordBody;
  const user = await findUserByEmail(email);
  if (!user) {
    res.json({ ok: true });
    return;
  }
  const resetToken = signToken({ userId: user.id, role: user.role, name: user.name, purpose: "password-reset" }, "15m");
  res.json({ ok: true, resetToken });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body.body as ResetPasswordBody;
  const payload = verifyToken(token);
  if (payload.purpose !== "password-reset") throw new ApiError(400, "Invalid reset token");
  await updatePassword(payload.userId, password);
  res.json({ ok: true });
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, "Authentication required");
  const user = await updateProfile(req.user.userId, req.body.body as { name?: string; phone?: string; avatar?: string | null });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    avatar: user.avatar,
    phone: user.phone,
    station: user.station,
    specialization: user.specialization,
  });
}

export async function uploadDocumentController(req: Request, res: Response): Promise<void> {
  const { fileName, data } = req.body.body as { fileName: string; data: string };
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_DOC_EXT.includes(ext)) {
    throw new ApiError(400, "Only PNG, JPG, or PDF documents are allowed");
  }
  const buffer = Buffer.from(data, "base64");
  if (buffer.length === 0) throw new ApiError(400, "Empty file data");
  if (buffer.length > 5 * 1024 * 1024) throw new ApiError(400, "Document exceeds 5MB limit");
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `doc-${Date.now()}-${safeName}`;
  writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);
  res.status(201).json({ url: `/uploads/${storedName}`, name: fileName });
}
