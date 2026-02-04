import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  IRefreshTokenRepository,
  RefreshTokenWithUser,
  UserEntity,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }> {
    const record = await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return { id: record.id };
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    return record ? this.toRefreshTokenWithUser(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private toRefreshTokenWithUser(record: {
    id: string;
    userId: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; passwordHash: string };
  }): RefreshTokenWithUser {
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
