import { injectable } from "tsyringe";
import nodemailer from "nodemailer";
import { env } from "@/config";
import { logger } from "@/lib/logger";
import type { IEmailService } from "@/types/service-interfaces";

@injectable()
export class EmailService implements IEmailService {
  private transport: ReturnType<typeof nodemailer.createTransport> | null =
    null;

  constructor() {
    if (env.SMTP_HOST) {
      this.transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      });
    }
  }

  async sendPasswordResetLink(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const from = env.SMTP_FROM || env.SMTP_USER || "noreply@tablespot.local";

    if (!this.transport) {
      logger.warn("SMTP not configured; skipping password reset email", {
        email,
        resetUrl,
      });
      return;
    }

    await this.transport.sendMail({
      from,
      to: email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetUrl}. The link expires in 1 hour.`,
      html: `<p>Use this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in 1 hour.</p>`,
    });
  }
}
