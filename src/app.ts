import "reflect-metadata";
import express from "express";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "@/lib/cors";
import { registerContainer, getAuthController } from "@/di/container";
import { createAuthRoutes } from "@/routes/auth.routes";
import { errorMiddleware } from "@/middleware/error.middleware";

export function createApp(): express.Express {
  registerContainer();

  const app = express();

  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json());

  const authController = getAuthController();
  app.use("/auth", createAuthRoutes(authController));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorMiddleware);

  return app;
}
