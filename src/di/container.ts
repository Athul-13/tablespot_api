import { container as tsyringeContainer } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  UserRepositoryToken,
  RefreshTokenRepositoryToken,
  PasswordResetTokenRepositoryToken,
  JwtServiceToken,
  EmailServiceToken,
} from "@/di/tokens";
import { PrismaUserRepository } from "@/repositories/user.repository";
import { PrismaRefreshTokenRepository } from "@/repositories/refresh-token.repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/password-reset-token.repository";
import { JwtService } from "@/lib/jwt.service";
import { EmailService } from "@/lib/email.service";
import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";

export function registerContainer(): void {
  tsyringeContainer.register<PrismaClient>(PrismaClient, {
    useValue: prisma,
  });

  tsyringeContainer.register(UserRepositoryToken, {
    useClass: PrismaUserRepository,
  });
  tsyringeContainer.register(RefreshTokenRepositoryToken, {
    useClass: PrismaRefreshTokenRepository,
  });
  tsyringeContainer.register(PasswordResetTokenRepositoryToken, {
    useClass: PrismaPasswordResetTokenRepository,
  });

  tsyringeContainer.register(JwtServiceToken, {
    useClass: JwtService,
  });
  tsyringeContainer.register(EmailServiceToken, {
    useClass: EmailService,
  });

  tsyringeContainer.register(AuthService, {
    useClass: AuthService,
  });
  tsyringeContainer.register(AuthController, {
    useClass: AuthController,
  });
}

export function getAuthController(): AuthController {
  return tsyringeContainer.resolve(AuthController);
}
