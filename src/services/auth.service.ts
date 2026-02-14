import * as crypto from "crypto";
import { injectable, inject } from "tsyringe";
import type { AuthUser } from "@/types/auth";
import {
  invalidCredentials,
  invalidToken,
  tokenExpired,
  emailAlreadyExists,
} from "@/errors/auth";
import type { IUserRepository } from "@/types/repository-interfaces";
import type { IRefreshTokenRepository } from "@/types/repository-interfaces";
import type { IPasswordResetTokenRepository } from "@/types/repository-interfaces";
import type {
  IJwtService,
  IEmailService,
  IPasswordHasher,
} from "@/types/service-interfaces";
import {
  UserRepositoryToken,
  RefreshTokenRepositoryToken,
  PasswordResetTokenRepositoryToken,
  JwtServiceToken,
  EmailServiceToken,
  PasswordHasherToken,
} from "@/di/tokens";
import type { SignupInput, LoginInput } from "@/validation/auth";
import { IAuthService, LoginResult } from "./interface/auth-service.interface";
import { env } from "@/config";

const PASSWORD_RESET_EXPIRY_MS = env.PASSWORD_RESET_EXPIRY_MS;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toAuthUser(id: string, email: string, name: string): AuthUser {
  return { id, email, name };
}


@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(UserRepositoryToken) private readonly userRepo: IUserRepository,
    @inject(RefreshTokenRepositoryToken)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    @inject(PasswordResetTokenRepositoryToken)
    private readonly passwordResetRepo: IPasswordResetTokenRepository,
    @inject(JwtServiceToken) private readonly jwtService: IJwtService,
    @inject(EmailServiceToken) private readonly emailService: IEmailService,
    @inject(PasswordHasherToken) private readonly passwordHasher: IPasswordHasher
  ) {}

  async signup(input: SignupInput): Promise<{ user: AuthUser }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw emailAlreadyExists();

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
      phone: input.phone ?? null,
    });
    return { user: toAuthUser(user.id, user.email, user.name) };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw invalidCredentials();

    const valid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash
    );
    if (!valid) throw invalidCredentials();

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.signAccess(payload);
    const refreshToken = this.jwtService.signRefresh(payload);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    await this.refreshTokenRepo.create(
      user.id,
      hashToken(refreshToken),
      refreshExpiresAt
    );

    return {
      user: toAuthUser(user.id, user.email, user.name),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined): Promise<LoginResult | null> {
    if (!refreshToken) return null;
    let payload;
    try {
      payload = this.jwtService.verifyRefresh(refreshToken);
    } catch {
      throw invalidToken();
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.refreshTokenRepo.delete(stored.id);
      throw tokenExpired();
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) throw invalidToken();

    const newPayload = { sub: user.id, email: user.email, name: user.name };
    const newAccessToken = this.jwtService.signAccess(newPayload);
    const newRefreshToken = this.jwtService.signRefresh(newPayload);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.delete(stored.id);
    await this.refreshTokenRepo.create(
      user.id,
      hashToken(newRefreshToken),
      refreshExpiresAt
    );

    return {
      user: toAuthUser(user.id, user.email, user.name),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (stored) await this.refreshTokenRepo.delete(stored.id);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // no leak

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await this.passwordResetRepo.create(user.id, tokenHash, expiresAt);
    await this.emailService.sendPasswordResetLink(user.email, rawToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const stored = await this.passwordResetRepo.findByTokenHash(tokenHash);
    if (!stored || stored.expiresAt < new Date()) throw invalidToken();

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepo.updatePassword(stored.userId, passwordHash);
    await this.passwordResetRepo.delete(stored.id);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw invalidCredentials();

    const valid = await this.passwordHasher.compare(
      currentPassword,
      user.passwordHash
    );
    if (!valid) throw invalidCredentials();

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepo.updatePassword(userId, passwordHash);
  }
}
