import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { findUserByEmail } from "../shared/shared.service.js";
import type { RegisterBody } from "./auth.types.js";

export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status === "REJECTED" || user.status === "PENDING") {
    throw new ApiError(403, "Account not approved yet");
  }
  return user;
}

export async function createOwner(data: RegisterBody) {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new ApiError(409, "Email already registered");
  const { password, ...profile } = data;
  return prisma.user.create({
    data: {
      ...profile,
      passwordHash: await bcrypt.hash(password, 10),
      role: "OWNER",
      status: "PENDING",
    },
  });
}

export async function updatePassword(userId: string, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
}

export function updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string | null }) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
