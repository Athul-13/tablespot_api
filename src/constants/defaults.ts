/**
 * Default values for environment variables.
 * Used when env vars are optional or not set; keeps env schema DRY and allows
 * reuse of these values elsewhere (e.g. validation, docs).
 */

export const DEFAULT_PORT = 4000;

export const DEFAULT_JWT_EXPIRES_IN = "15m";
export const DEFAULT_JWT_REFRESH_EXPIRES_IN = "7d";

/** Password reset link validity: 1 hour in milliseconds */
export const DEFAULT_PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

export const DEFAULT_CORS_ORIGINS = "http://localhost:5173";
export const DEFAULT_FRONTEND_URL = "http://localhost:5173";

export const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

export const DEFAULT_COOKIE_SAME_SITE = "lax" as const;
export const COOKIE_SAME_SITE_VALUES = ["lax", "strict", "none"] as const;

export const NODE_ENV_VALUES = ["development", "production", "test"] as const;

export const DEFAULT_SMTP_PORT = 587;
