import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME, verifyToken, type JwtPayload } from "../lib/auth.js";
import { ApiError } from "./error.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new ApiError(401, "Authentication required");
  req.user = verifyToken(token);
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new ApiError(401, "Authentication required");
    if (!roles.map((r) => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      throw new ApiError(403, "Insufficient permissions");
    }
    next();
  };
}
