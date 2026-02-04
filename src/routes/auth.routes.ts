import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post("/signup", authController.signup());
  router.post("/login", authController.login());
  router.post("/logout", authController.logout());
  router.post("/refresh", authController.refresh());
  router.post("/forgot-password", authController.forgotPassword());
  router.post("/reset-password", authController.resetPassword());

  return router;
}
