import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { router as authRoutes } from "./modules/auth/auth.routes.js";
import { router as sharedRoutes } from "./modules/shared/shared.routes.js";
import { router as adminRoutes } from "./modules/admin/admin.routes.js";
import { router as ownerRoutes } from "./modules/owner/owner.routes.js";
import { router as advisorRoutes } from "./modules/advisor/advisor.routes.js";
import { router as mechanicRoutes } from "./modules/mechanic/mechanic.routes.js";
import { router as uploadRoutes } from "./modules/upload/upload.routes.js";
import { router as paymentRoutes } from "./modules/payment/payment.routes.js";
import { webhookRouter as paymentWebhookRoutes } from "./modules/payment/payment.webhook.js";

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:3500", credentials: true }));
  app.use("/api/payments/webhook", express.raw({ type: "application/json" }), paymentWebhookRoutes);
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ service: "MotoServe API", version: "0.1.0" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", sharedRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", ownerRoutes);
  app.use("/api", advisorRoutes);
  app.use("/api", mechanicRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api", paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
