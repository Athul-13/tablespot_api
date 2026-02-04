/** Minimal user shape used by repository callers (e.g. AuthService). */
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  phone?: string | null;
}

/** Refresh token record with user included (e.g. for refresh flow). */
export interface RefreshTokenWithUser {
  id: string;
  userId: string;
  expiresAt: Date;
  user: UserEntity;
}

/** Password reset token record with user included. */
export interface PasswordResetTokenWithUser {
  id: string;
  userId: string;
  expiresAt: Date;
  user: UserEntity;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  updatePassword(id: string, passwordHash: string): Promise<UserEntity>;
}

export interface IRefreshTokenRepository {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export interface IPasswordResetTokenRepository {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenWithUser | null>;
  delete(id: string): Promise<void>;
}
