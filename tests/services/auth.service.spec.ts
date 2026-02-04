import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import type { UserEntity } from "@/types/repository-interfaces";

vi.mock("@/config", () => ({
  env: { BCRYPT_SALT_ROUNDS: 10 },
}));
import type { RefreshTokenWithUser } from "@/types/repository-interfaces";
import type { PasswordResetTokenWithUser } from "@/types/repository-interfaces";
import type { IJwtService, IEmailService } from "@/types/service-interfaces";
import { AuthService } from "@/services/auth.service";
import { AuthError } from "@/errors/auth";
import { env } from "@/config";

const mockUserRepo = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  updatePassword: vi.fn(),
};

const mockRefreshTokenRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  delete: vi.fn(),
  deleteByUserId: vi.fn(),
};

const mockPasswordResetRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  delete: vi.fn(),
};

const mockJwtService: IJwtService = {
  signAccess: vi.fn().mockReturnValue("access-token"),
  signRefresh: vi.fn().mockReturnValue("refresh-token"),
  verifyAccess: vi.fn(),
  verifyRefresh: vi.fn(),
  getAccessTokenMaxAgeSeconds: vi.fn().mockReturnValue(900),
  getRefreshTokenMaxAgeSeconds: vi.fn().mockReturnValue(604800),
};

const mockEmailService: IEmailService = {
  sendPasswordResetLink: vi.fn().mockResolvedValue(undefined),
};

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "",
    ...overrides,
  };
}

function makeRefreshToken(overrides: Partial<RefreshTokenWithUser> = {}): RefreshTokenWithUser {
  return {
    id: "rt-1",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 86400000),
    user: makeUser(),
    ...overrides,
  };
}

function makePasswordResetToken(
  overrides: Partial<PasswordResetTokenWithUser> = {}
): PasswordResetTokenWithUser {
  return {
    id: "prt-1",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 3600000),
    user: makeUser(),
    ...overrides,
  };
}

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      mockUserRepo as never,
      mockRefreshTokenRepo as never,
      mockPasswordResetRepo as never,
      mockJwtService,
      mockEmailService
    );
  });

  describe("signup", () => {
    it("returns user on success and does not include password", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const hashed = await bcrypt.hash("password123", env.BCRYPT_SALT_ROUNDS);
      mockUserRepo.create.mockResolvedValue(
        makeUser({ id: "new-id", email: "new@example.com", name: "New", passwordHash: hashed })
      );

      const result = await service.signup({
        name: "New",
        email: "new@example.com",
        password: "password123",
      });

      expect(result.user).toEqual({
        id: "new-id",
        email: "new@example.com",
        name: "New",
      });
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("new@example.com");
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new@example.com",
          name: "New",
          phone: null,
        })
      );
    });

    it("throws AuthError with EMAIL_ALREADY_EXISTS when email exists", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.signup({
          name: "Test",
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow(AuthError);

      await expect(
        service.signup({
          name: "Test",
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({
        code: "EMAIL_ALREADY_EXISTS",
        statusCode: 400,
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns user, accessToken, refreshToken and calls refreshTokenRepo.create", async () => {
      const passwordHash = await bcrypt.hash("password123", env.BCRYPT_SALT_ROUNDS);
      const user = makeUser({ passwordHash });
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockRefreshTokenRepo.create.mockResolvedValue({ id: "rt-1" });

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user).toEqual({ id: user.id, email: user.email, name: user.name });
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(mockJwtService.signAccess).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      expect(mockJwtService.signRefresh).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
        expect.any(Date)
      );
    });

    it("throws invalidCredentials when user not found", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "any" })
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", statusCode: 401 });

      expect(mockJwtService.signAccess).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled();
    });

    it("throws invalidCredentials when password is wrong", async () => {
      const passwordHash = await bcrypt.hash("correct", env.BCRYPT_SALT_ROUNDS);
      mockUserRepo.findByEmail.mockResolvedValue(makeUser({ passwordHash }));

      await expect(
        service.login({ email: "test@example.com", password: "wrong" })
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", statusCode: 401 });

      expect(mockJwtService.signAccess).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("returns null when no refresh token provided", async () => {
      const result = await service.refresh(undefined);
      expect(result).toBeNull();
      expect(mockJwtService.verifyRefresh).not.toHaveBeenCalled();
    });

    it("returns new tokens and rotates refresh token on valid token", async () => {
      const payload = { sub: "user-1", email: "test@example.com", name: "Test" };
      mockJwtService.verifyRefresh.mockReturnValue(payload);
      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(makeRefreshToken());
      mockUserRepo.findById.mockResolvedValue(makeUser());
      mockJwtService.signAccess.mockReturnValue("new-access");
      mockJwtService.signRefresh.mockReturnValue("new-refresh");
      mockRefreshTokenRepo.delete.mockResolvedValue(undefined);
      mockRefreshTokenRepo.create.mockResolvedValue({ id: "rt-2" });

      const result = await service.refresh("valid-refresh-token");

      expect(result).not.toBeNull();
      expect(result!.user).toEqual({ id: "user-1", email: "test@example.com", name: "Test User" });
      expect(result!.accessToken).toBe("new-access");
      expect(result!.refreshToken).toBe("new-refresh");
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith("rt-1");
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        "user-1",
        expect.any(String),
        expect.any(Date)
      );
    });

    it("throws invalidToken when verifyRefresh throws", async () => {
      mockJwtService.verifyRefresh.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(service.refresh("bad-token")).rejects.toMatchObject({
        code: "INVALID_TOKEN",
        statusCode: 401,
      });
    });

    it("throws tokenExpired when stored token is expired", async () => {
      const payload = { sub: "user-1", email: "test@example.com", name: "Test" };
      mockJwtService.verifyRefresh.mockReturnValue(payload);
      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(
        makeRefreshToken({ expiresAt: new Date(0) })
      );

      await expect(service.refresh("expired-token")).rejects.toMatchObject({
        code: "TOKEN_EXPIRED",
        statusCode: 401,
      });
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith("rt-1");
    });

    it("throws invalidToken when user not found after valid token", async () => {
      mockJwtService.verifyRefresh.mockReturnValue({
        sub: "user-1",
        email: "test@example.com",
        name: "Test",
      });
      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(makeRefreshToken());
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.refresh("valid-token")).rejects.toMatchObject({
        code: "INVALID_TOKEN",
        statusCode: 401,
      });
    });
  });

  describe("logout", () => {
    it("deletes refresh token when token provided and found", async () => {
      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(makeRefreshToken());

      await service.logout("some-refresh-token");

      expect(mockRefreshTokenRepo.findByTokenHash).toHaveBeenCalledWith(expect.any(String));
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith("rt-1");
    });

    it("does nothing when no token provided", async () => {
      await service.logout(undefined);

      expect(mockRefreshTokenRepo.findByTokenHash).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepo.delete).not.toHaveBeenCalled();
    });

    it("does nothing when token not found in store", async () => {
      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(null);

      await service.logout("unknown-token");

      expect(mockRefreshTokenRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("creates reset token and sends email when user exists", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(makeUser());
      mockPasswordResetRepo.create.mockResolvedValue({ id: "prt-1" });

      await service.requestPasswordReset("test@example.com");

      expect(mockPasswordResetRepo.create).toHaveBeenCalledWith(
        "user-1",
        expect.any(String),
        expect.any(Date)
      );
      expect(mockEmailService.sendPasswordResetLink).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String)
      );
    });

    it("does not throw and does not send email when user does not exist", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await service.requestPasswordReset("nobody@example.com");

      expect(mockPasswordResetRepo.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("updates password and deletes token on valid token", async () => {
      mockPasswordResetRepo.findByTokenHash.mockResolvedValue(
        makePasswordResetToken({ expiresAt: new Date(Date.now() + 3600000) })
      );
      mockUserRepo.updatePassword.mockResolvedValue(makeUser());
      mockPasswordResetRepo.delete.mockResolvedValue(undefined);

      await service.resetPassword("valid-reset-token", "newPassword123");

      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
        "user-1",
        expect.any(String)
      );
      expect(mockPasswordResetRepo.delete).toHaveBeenCalledWith("prt-1");
    });

    it("throws invalidToken when token not found", async () => {
      mockPasswordResetRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        service.resetPassword("invalid-token", "newPassword123")
      ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });

      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
      expect(mockPasswordResetRepo.delete).not.toHaveBeenCalled();
    });

    it("throws invalidToken when token is expired", async () => {
      mockPasswordResetRepo.findByTokenHash.mockResolvedValue(
        makePasswordResetToken({ expiresAt: new Date(0) })
      );

      await expect(
        service.resetPassword("expired-token", "newPassword123")
      ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });

      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    });
  });
});
