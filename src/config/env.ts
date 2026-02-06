import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .optional()
    .default("4000")
    .transform((v) => Number(v)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .optional()
    .default("10")
    .transform((v) => Number(v)),
  // Cookies (HTTP-only auth cookies)
  COOKIE_SECURE: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  COOKIE_SAME_SITE: z
    .enum(["lax", "strict", "none"])
    .default("lax"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  // Email (optional in dev for forgot-password)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .default("587")
    .transform((v) => Number(v)),
  SMTP_SECURE: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.flatten().fieldErrors;
    const formatted = Object.entries(messages)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
    throw new Error(`Invalid environment: ${formatted}`);
  }
  return result.data;
}

export const env = loadEnv();
