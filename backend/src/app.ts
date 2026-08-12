import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { router as authRoutes } from "./modules/auth/auth.routes.js";
import { router as sharedRoutes } from "./modules/shared/shared.routes.js";
import { router as adminRoutes } from "./modules/admin/admin.routes.js";
import { router as ownerRoutes } from "./modules/owner/owner.routes.js";
import { router as advisorRoutes } from "./modules/advisor/advisor.routes.js";
import { router as mechanicRoutes } from "./modules/mechanic/mechanic.routes.js";

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:3500", credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/", (_req, res) => {
    res.json({ service: "MotoServe API", version: "0.1.0" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", sharedRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", ownerRoutes);
  app.use("/api", advisorRoutes);
  app.use("/api", mechanicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
