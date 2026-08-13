import type { Request, Response } from "express";
import { COOKIE_NAME, cookieOptions, signToken, verifyToken } from "../../lib/auth.js";
import { ApiError } from "../../middleware/error.js";
import { findUserByEmail, findUserById } from "../shared/shared.service.js";
import { createOwner, updatePassword, updateProfile, verifyCredentials } from "./auth.service.js";
import type { ForgotPasswordBody, RegisterBody, ResetPasswordBody } from "./auth.types.js";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body.body as { email: string; password: string };
  const user = await verifyCredentials(email, password);
  const token = signToken({ userId: user.id, role: user.role, name: user.name });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    avatar: user.avatar,
    token,
  });
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
