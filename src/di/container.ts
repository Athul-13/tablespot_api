import { container as tsyringeContainer } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  UserRepositoryToken,
  RefreshTokenRepositoryToken,
  PasswordResetTokenRepositoryToken,
  JwtServiceToken,
  EmailServiceToken,
  PasswordHasherToken,
} from "@/di/tokens";
import { PrismaUserRepository } from "@/repositories/user.repository";
import { PrismaRefreshTokenRepository } from "@/repositories/refresh-token.repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/password-reset-token.repository";
import { JwtService } from "@/lib/jwt.service";
import { EmailService } from "@/lib/email.service";
import { BcryptPasswordHasher } from "@/lib/bcrypt-password-hasher";
import type { IJwtService } from "@/types/service-interfaces";
import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";

export function registerContainer(): void {
  tsyringeContainer.register<PrismaClient>(PrismaClient, {
    useValue: prisma,
  });

  tsyringeContainer.register(UserRepositoryToken, {
    useFactory: (c) =>
      new PrismaUserRepository(c.resolve(PrismaClient) as PrismaClient),
  });
  tsyringeContainer.register(RefreshTokenRepositoryToken, {
    useFactory: (c) =>
      new PrismaRefreshTokenRepository(
        c.resolve(PrismaClient) as PrismaClient
      ),
  });
  tsyringeContainer.register(PasswordResetTokenRepositoryToken, {
    useFactory: (c) =>
      new PrismaPasswordResetTokenRepository(
        c.resolve(PrismaClient) as PrismaClient
      ),
  });

  tsyringeContainer.register(JwtServiceToken, {
    useClass: JwtService,
  });
  tsyringeContainer.register(EmailServiceToken, {
    useClass: EmailService,
  });
  tsyringeContainer.register(PasswordHasherToken, {
    useClass: BcryptPasswordHasher,
  });

  tsyringeContainer.register(AuthService, {
    useFactory: (c) =>
      new AuthService(
        c.resolve(UserRepositoryToken) as never,
        c.resolve(RefreshTokenRepositoryToken) as never,
        c.resolve(PasswordResetTokenRepositoryToken) as never,
        c.resolve(JwtServiceToken) as never,
        c.resolve(EmailServiceToken) as never,
        c.resolve(PasswordHasherToken) as never
      ),
  });
  tsyringeContainer.register(AuthController, {
    useFactory: (c) =>
      new AuthController(
        c.resolve(AuthService),
        c.resolve(JwtServiceToken) as never
      ),
  });
}

export function getAuthController(): AuthController {
  return tsyringeContainer.resolve(AuthController);
}

export function getJwtService(): IJwtService {
  return tsyringeContainer.resolve(JwtServiceToken) as IJwtService;
}
