import type { JwtPayload } from "@/types/auth";

/** Payload used for signing access/refresh tokens (no iat/exp). */
export type JwtSignPayload = Omit<JwtPayload, "iat" | "exp">;

export interface IJwtService {
  signAccess(payload: JwtSignPayload): string;
  signRefresh(payload: JwtSignPayload): string;
  verifyAccess(token: string): JwtPayload;
  verifyRefresh(token: string): JwtPayload;
  getAccessTokenMaxAgeSeconds(): number;
  getRefreshTokenMaxAgeSeconds(): number;
}

export interface IEmailService {
  sendPasswordResetLink(email: string, resetToken: string): Promise<void>;
}
