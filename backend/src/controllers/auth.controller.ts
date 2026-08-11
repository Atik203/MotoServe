import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, cookieOptions, signToken } from "../lib/auth.js";
import { ApiError } from "../middleware/error.js";
import { findUserByEmail, findUserById } from "../services/query.service.js";
import { prisma } from "../lib/prisma.js";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body.body as { email: string; password: string };
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status === "REJECTED" || user.status === "PENDING") {
    throw new ApiError(403, "Account not approved yet");
  }
  const token = signToken({ userId: user.id, role: user.role, name: user.name });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role.toLowerCase(), avatar: user.avatar });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, phone, password } = req.body.body as {
    name: string;
    email: string;
    phone?: string;
    password: string;
  };
  const existing = await findUserByEmail(email);
  if (existing) throw new ApiError(409, "Email already registered");
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: "OWNER",
      status: "PENDING",
    },
  });
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
