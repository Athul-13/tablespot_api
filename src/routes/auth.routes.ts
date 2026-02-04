import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { authMiddleware } from "@/middleware/auth.middleware";

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post("/signup", authController.signup());
  router.post("/login", authController.login());
  router.post("/logout", authController.logout());
  router.post("/refresh", authController.refresh());
  router.post("/forgot-password", authController.forgotPassword());
  router.post("/reset-password", authController.resetPassword());

  router.get("/me", authMiddleware(), (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json(req.user);
  });

  return router;
}
