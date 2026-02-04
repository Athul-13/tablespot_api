import nodemailer from "nodemailer";
import { env } from "@/config";
import { logger } from "@/lib/logger";

function getTransport() {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
}

const transport = getTransport();

export async function sendPasswordResetLink(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = env.SMTP_FROM || env.SMTP_USER || "noreply@tablespot.local";

  if (!transport) {
    logger.warn("SMTP not configured; skipping password reset email", {
      email,
      resetUrl,
    });
    return;
  }

  await transport.sendMail({
    from,
    to: email,
    subject: "Reset your password",
    text: `Use this link to reset your password: ${resetUrl}. The link expires in 1 hour.`,
    html: `<p>Use this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in 1 hour.</p>`,
  });
}
