import type { CookieOptions } from "express";
import { env } from "@/config";

export function getAuthCookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: maxAgeSeconds * 1000,
  };
}
