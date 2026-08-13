import { prisma } from "./prisma.js";

export async function logAudit(user: string, action: string): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { user, action } });
  } catch {
    // audit logging must never break the main flow
  }
}
