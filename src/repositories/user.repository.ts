import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  IUserRepository,
  CreateUserData,
  UserEntity,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        phone: data.phone ?? undefined,
      },
    });
    return this.toEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return user ? this.toEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toEntity(user) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return this.toEntity(user);
  }

  private toEntity(user: {
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
