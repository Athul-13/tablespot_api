import "reflect-metadata";
import express from "express";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "@/lib/cors";
import { registerContainer, getAuthController, getJwtService } from "@/di/container";
import { createAuthRoutes } from "@/routes/auth.routes";
import { requestIdMiddleware } from "@/middleware/request-id.middleware";
import { requestLoggerMiddleware } from "@/middleware/request-logger.middleware";
import { errorMiddleware } from "@/middleware/error.middleware";

export function createApp(): express.Express {
  registerContainer();

  const app = express();

  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json());
  app.use(requestIdMiddleware());
  app.use(requestLoggerMiddleware());

  const authController = getAuthController();
  const jwtService = getJwtService();
  app.use("/auth", createAuthRoutes(authController, jwtService));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorMiddleware);

  return app;
}
