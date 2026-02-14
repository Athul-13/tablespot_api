import "dotenv/config";
import { z } from "zod";
import {
  DEFAULT_PORT,
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_JWT_REFRESH_EXPIRES_IN,
  DEFAULT_PASSWORD_RESET_EXPIRY_MS,
  DEFAULT_CORS_ORIGINS,
  DEFAULT_BCRYPT_SALT_ROUNDS,
  DEFAULT_COOKIE_SAME_SITE,
  COOKIE_SAME_SITE_VALUES,
  NODE_ENV_VALUES,
  DEFAULT_FRONTEND_URL,
  DEFAULT_SMTP_PORT,
} from "@/constants/defaults";

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
  PORT: z
    .string()
    .optional()
    .default(String(DEFAULT_PORT))
    .transform((v) => Number(v)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default(DEFAULT_JWT_EXPIRES_IN),
  JWT_REFRESH_EXPIRES_IN: z.string().default(DEFAULT_JWT_REFRESH_EXPIRES_IN),
  PASSWORD_RESET_EXPIRY_MS: z
    .number()
    .optional()
    .default(DEFAULT_PASSWORD_RESET_EXPIRY_MS),
  CORS_ORIGINS: z.string().default(DEFAULT_CORS_ORIGINS),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .optional()
    .default(String(DEFAULT_BCRYPT_SALT_ROUNDS))
    .transform((v) => Number(v)),
  COOKIE_SECURE: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  COOKIE_SAME_SITE: z.enum(COOKIE_SAME_SITE_VALUES).default(DEFAULT_COOKIE_SAME_SITE),
  FRONTEND_URL: z.string().url().default(DEFAULT_FRONTEND_URL),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .default(String(DEFAULT_SMTP_PORT))
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
