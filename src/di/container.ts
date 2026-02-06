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
  RestaurantRepositoryToken,
  CommentRepositoryToken,
  RatingRepositoryToken,
} from "@/di/tokens";
import { PrismaUserRepository } from "@/repositories/user.repository";
import { PrismaRefreshTokenRepository } from "@/repositories/refresh-token.repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/password-reset-token.repository";
import { PrismaRestaurantRepository } from "@/repositories/restaurant.repository";
import { PrismaCommentRepository } from "@/repositories/comment.repository";
import { PrismaRatingRepository } from "@/repositories/rating.repository";
import { JwtService } from "@/lib/jwt.service";
import { EmailService } from "@/lib/email.service";
import { BcryptPasswordHasher } from "@/lib/bcrypt-password-hasher";
import type { IJwtService } from "@/types/service-interfaces";
import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";
import { RestaurantService } from "@/services/restaurant.service";
import { CommentService } from "@/services/comment.service";
import { RatingService } from "@/services/rating.service";
import { RestaurantController } from "@/controllers/restaurant.controller";
import { CommentController } from "@/controllers/comment.controller";
import { RatingController } from "@/controllers/rating.controller";

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
  tsyringeContainer.register(RestaurantRepositoryToken, {
    useFactory: (c) =>
      new PrismaRestaurantRepository(c.resolve(PrismaClient) as PrismaClient),
  });
  tsyringeContainer.register(CommentRepositoryToken, {
    useFactory: (c) =>
      new PrismaCommentRepository(c.resolve(PrismaClient) as PrismaClient),
  });
  tsyringeContainer.register(RatingRepositoryToken, {
    useFactory: (c) =>
      new PrismaRatingRepository(c.resolve(PrismaClient) as PrismaClient),
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

  tsyringeContainer.register(RestaurantService, {
    useFactory: (c) =>
      new RestaurantService(
        c.resolve(RestaurantRepositoryToken) as never,
        c.resolve(RatingRepositoryToken) as never
      ),
  });
  tsyringeContainer.register(CommentService, {
    useFactory: (c) =>
      new CommentService(
        c.resolve(CommentRepositoryToken) as never,
        c.resolve(RestaurantRepositoryToken) as never
      ),
  });
  tsyringeContainer.register(RatingService, {
    useFactory: (c) =>
      new RatingService(
        c.resolve(RatingRepositoryToken) as never,
        c.resolve(RestaurantRepositoryToken) as never
      ),
  });

  tsyringeContainer.register(RestaurantController, {
    useFactory: (c) => new RestaurantController(c.resolve(RestaurantService)),
  });
  tsyringeContainer.register(CommentController, {
    useFactory: (c) => new CommentController(c.resolve(CommentService)),
  });
  tsyringeContainer.register(RatingController, {
    useFactory: (c) => new RatingController(c.resolve(RatingService)),
  });
}

export function getAuthController(): AuthController {
  return tsyringeContainer.resolve(AuthController);
}

export function getJwtService(): IJwtService {
  return tsyringeContainer.resolve(JwtServiceToken) as IJwtService;
}

export function getRestaurantController(): RestaurantController {
  return tsyringeContainer.resolve(RestaurantController);
}

export function getCommentController(): CommentController {
  return tsyringeContainer.resolve(CommentController);
}

export function getRatingController(): RatingController {
  return tsyringeContainer.resolve(RatingController);
}
