import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { router as authRouter } from "./routes/auth.router.js";
import { router as apiRouter } from "./routes/api.router.js";
import { router as healthRouter } from "./routes/health.router.js";

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:3000", credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ service: "MotoServe API", version: "0.1.0" });
  });
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
