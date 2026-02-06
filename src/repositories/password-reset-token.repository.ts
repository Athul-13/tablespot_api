import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  IPasswordResetTokenRepository,
  PasswordResetTokenWithUser,
  UserEntity,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaPasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }> {
    const record = await this.prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return { id: record.id };
  }

  async findByTokenHash(
    tokenHash: string
  ): Promise<PasswordResetTokenWithUser | null> {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    return record ? this.toPasswordResetTokenWithUser(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passwordResetToken.delete({
      where: { id },
    });
  }

  private toPasswordResetTokenWithUser(record: {
    id: string;
    userId: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; passwordHash: string };
  }): PasswordResetTokenWithUser {
    return {
      id: record.id,
      userId: record.userId,
      expiresAt: record.expiresAt,
      user: this.toUserEntity(record.user),
    };
  }

  private toUserEntity(user: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
  }): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
    };
  }
}
