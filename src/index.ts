import "reflect-metadata";
import express from "express";
import cookieParser from "cookie-parser";
import { env } from "@/config";
import { corsMiddleware } from "@/lib/cors";
import { logger } from "@/lib/logger";
import { registerContainer, getAuthController } from "@/di/container";
import { createAuthRoutes } from "@/routes/auth.routes";
import { errorMiddleware } from "@/middleware/error.middleware";

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

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("Server listening", { port: env.PORT });
});
