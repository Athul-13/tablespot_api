import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  IRatingRepository,
  RatingEntity,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaRatingRepository implements IRatingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(
    restaurantId: string,
    userId: string,
    stars: number
  ): Promise<RatingEntity> {
    const rating = await this.prisma.rating.upsert({
      where: {
        restaurantId_userId: { restaurantId, userId },
      },
      create: { restaurantId, userId, stars },
      update: { stars },
    });
    return this.toEntity(rating);
  }

  async getByRestaurantId(restaurantId: string): Promise<RatingEntity[]> {
    const ratings = await this.prisma.rating.findMany({
      where: { restaurantId },
    });
    return ratings.map((r) => this.toEntity(r));
  }

  async getAverageRating(restaurantId: string): Promise<number> {
    const result = await this.prisma.rating.aggregate({
      where: { restaurantId },
      _avg: { stars: true },
      _count: { stars: true },
    });
    if (result._count.stars === 0) return 0;
    return result._avg.stars ?? 0;
  }

  async getByRestaurantAndUser(
    restaurantId: string,
    userId: string
  ): Promise<RatingEntity | null> {
    const rating = await this.prisma.rating.findUnique({
      where: {
        restaurantId_userId: { restaurantId, userId },
      },
    });
    return rating ? this.toEntity(rating) : null;
  }

  private toEntity(rating: {
    id: string;
    restaurantId: string;
    userId: string;
    stars: number;
    createdAt: Date;
    updatedAt: Date;
  }): RatingEntity {
    return {
      id: rating.id,
      restaurantId: rating.restaurantId,
      userId: rating.userId,
      stars: rating.stars,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }
}
