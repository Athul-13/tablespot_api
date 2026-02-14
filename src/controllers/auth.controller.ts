import type { RequestHandler } from "express";
import { injectable, inject } from "tsyringe";
import type { IJwtService } from "@/types/service-interfaces";
import { AuthServiceToken, JwtServiceToken } from "@/di/tokens";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/validation/auth";
import { getAuthCookieOptions } from "@/lib/cookie-options";
import { AUTH_COOKIE_NAMES } from "@/types/auth";
import type { AuthError } from "@/errors/auth";
import { IAuthService } from "@/services/interface/auth-service.interface";

function isAuthError(e: unknown): e is AuthError {
  return e instanceof Error && e.name === "AuthError";
}

@injectable()
export class AuthController {
  constructor(
    @inject(AuthServiceToken) private readonly authService: IAuthService,
    @inject(JwtServiceToken) private readonly jwtService: IJwtService
  ) {}

  signup(): RequestHandler {
    return async (req, res, next) => {
      try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const { user } = await this.authService.signup(parsed.data);
        res.status(201).json({ user });
      } catch (e) {
        if (isAuthError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  login(): RequestHandler {
    return async (req, res, next) => {
      try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const { user, accessToken, refreshToken } =
          await this.authService.login(parsed.data);

        const accessOptions = getAuthCookieOptions(
          this.jwtService.getAccessTokenMaxAgeSeconds()
        );
        const refreshOptions = getAuthCookieOptions(
          this.jwtService.getRefreshTokenMaxAgeSeconds()
        );

        res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessOptions);
        res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshOptions);
        res.status(200).json({ user });
      } catch (e) {
        if (isAuthError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  refresh(): RequestHandler {
    return async (req, res, next) => {
      try {
        const refreshToken =
          req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
        const result = await this.authService.refresh(refreshToken);
        if (!result) {
          res.status(401).json({ error: "Refresh token required" });
          return;
        }

        const accessOptions = getAuthCookieOptions(
          this.jwtService.getAccessTokenMaxAgeSeconds()
        );
        const refreshOptions = getAuthCookieOptions(
          this.jwtService.getRefreshTokenMaxAgeSeconds()
        );

        res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, accessOptions);
        res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, refreshOptions);
        res.status(200).json({ user: result.user });
      } catch (e) {
        if (isAuthError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  logout(): RequestHandler {
    return async (req, res, next) => {
      try {
        const refreshToken =
          req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
        await this.authService.logout(refreshToken);

        const clearOptions = getAuthCookieOptions(0);
        res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, clearOptions);
        res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, clearOptions);
        res.status(200).json({ ok: true });
      } catch (e) {
        next(e);
      }
    };
  }

  forgotPassword(): RequestHandler {
    return async (req, res, next) => {
      try {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        await this.authService.requestPasswordReset(parsed.data.email);
        res.status(200).json({
          message: "If an account exists for this email, you will receive a password reset link.",
        });
      } catch (e) {
        next(e);
      }
    };
  }

  resetPassword(): RequestHandler {
    return async (req, res, next) => {
      try {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        await this.authService.resetPassword(
          parsed.data.token,
          parsed.data.newPassword
        );
        res.status(200).json({ message: "Password reset successfully" });
      } catch (e) {
        if (isAuthError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  changePassword(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        await this.authService.changePassword(
          req.user.id,
          parsed.data.currentPassword,
          parsed.data.newPassword
        );
        res.status(200).json({ message: "Password changed successfully" });
      } catch (e) {
        if (isAuthError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }
}
