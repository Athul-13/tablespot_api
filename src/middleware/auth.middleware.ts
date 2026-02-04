import type { RequestHandler } from "express";
import { verifyAccess } from "@/lib/jwt";
import { AUTH_COOKIE_NAMES } from "@/types/auth";
import type { AuthUser } from "@/types/auth";
import { invalidToken } from "@/errors/auth";

/* eslint-disable @typescript-eslint/no-namespace -- Express Request augmentation requires namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function authMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const token =
      req.cookies?.[AUTH_COOKIE_NAMES.ACCESS_TOKEN] ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = verifyAccess(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
      };
      next();
    } catch {
      next(invalidToken());
    }
  };
}
