import jwt from "jsonwebtoken";
import { env } from "@/config";
import type { JwtPayload } from "@/types/auth";

const ACCESS_EXPIRES_IN = env.JWT_EXPIRES_IN;
const REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;

export function signAccess(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email, name: payload.name },
    env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions
  );
}

export function signRefresh(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email, name: payload.name },
    env.JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyAccess(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  return decoded;
}

export function verifyRefresh(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  return decoded;
}

/** Parse expiry string (e.g. "15m", "7d") to seconds for cookie maxAge. */
export function expiryToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 min
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 900;
  }
}

export const ACCESS_TOKEN_MAX_AGE_SECONDS = expiryToSeconds(ACCESS_EXPIRES_IN);
export const REFRESH_TOKEN_MAX_AGE_SECONDS = expiryToSeconds(REFRESH_EXPIRES_IN);
