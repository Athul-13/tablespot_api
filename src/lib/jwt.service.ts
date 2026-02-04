import { injectable } from "tsyringe";
import jwt from "jsonwebtoken";
import { env } from "@/config";
import type { IJwtService } from "@/types/service-interfaces";
import type { JwtPayload } from "@/types/auth";

const ACCESS_EXPIRES_IN = env.JWT_EXPIRES_IN;
const REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;

function expiryToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
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

@injectable()
export class JwtService implements IJwtService {
  signAccess(payload: { sub: string; email: string; name: string }): string {
    return jwt.sign(
      { sub: payload.sub, email: payload.email, name: payload.name },
      env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions
    );
  }

  signRefresh(payload: { sub: string; email: string; name: string }): string {
    return jwt.sign(
      { sub: payload.sub, email: payload.email, name: payload.name },
      env.JWT_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
  }

  verifyAccess(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }

  verifyRefresh(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }

  getAccessTokenMaxAgeSeconds(): number {
    return expiryToSeconds(ACCESS_EXPIRES_IN);
  }

  getRefreshTokenMaxAgeSeconds(): number {
    return expiryToSeconds(REFRESH_EXPIRES_IN);
  }
}
