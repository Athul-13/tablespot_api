import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  ICommentRepository,
  CommentEntity,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    restaurantId: string,
    userId: string,
    body: string
  ): Promise<CommentEntity> {
    const comment = await this.prisma.comment.create({
      data: { restaurantId, userId, body },
      include: { user: true },
    });
    return this.toEntity(comment);
  }

  async findByRestaurantId(restaurantId: string): Promise<CommentEntity[]> {
    const comments = await this.prisma.comment.findMany({
      where: { restaurantId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return comments.map((c) => this.toEntity(c));
  }

  async findById(id: string): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { user: true },
    });
    return comment ? this.toEntity(comment) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  private toEntity(comment: {
    id: string;
    restaurantId: string;
    userId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: string; name: string };
  }): CommentEntity {
    return {
      id: comment.id,
      restaurantId: comment.restaurantId,
      userId: comment.userId,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      ...(comment.user && {
        user: { id: comment.user.id, name: comment.user.name },
      }),
    };
  }
}
