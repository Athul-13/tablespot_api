import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import type {
  IRestaurantRepository,
  RestaurantEntity,
  CreateRestaurantData,
  UpdateRestaurantData,
  ListRestaurantsFilter,
} from "@/types/repository-interfaces";

@injectable()
export class PrismaRestaurantRepository implements IRestaurantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateRestaurantData,
    createdByUserId: string
  ): Promise<RestaurantEntity> {
    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: data.name,
        fullAddress: data.fullAddress,
        phone: data.phone,
        cuisineType: data.cuisineType,
        imageUrl: data.imageUrl ?? undefined,
        createdByUserId,
      },
    });
    return this.toEntity(restaurant);
  }

  async findById(id: string): Promise<RestaurantEntity | null> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });
    return restaurant ? this.toEntity(restaurant) : null;
  }

  async update(
    id: string,
    data: UpdateRestaurantData
  ): Promise<RestaurantEntity> {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.fullAddress !== undefined && { fullAddress: data.fullAddress }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.cuisineType !== undefined && { cuisineType: data.cuisineType }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
    return this.toEntity(restaurant);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.restaurant.delete({
      where: { id },
    });
  }

  async list(filters?: ListRestaurantsFilter): Promise<RestaurantEntity[]> {
    const where =
      filters?.cuisineType !== undefined
        ? { cuisineType: filters.cuisineType }
        : {};
    const restaurants = await this.prisma.restaurant.findMany({
      where,
      take: filters?.limit ?? undefined,
      skip: filters?.offset ?? undefined,
      orderBy: { createdAt: "desc" },
    });
    return restaurants.map((r) => this.toEntity(r));
  }

  private toEntity(restaurant: {
    id: string;
    name: string;
    fullAddress: string;
    phone: string;
    cuisineType: string;
    imageUrl: string | null;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
  }): RestaurantEntity {
    return {
      id: restaurant.id,
      name: restaurant.name,
      fullAddress: restaurant.fullAddress,
      phone: restaurant.phone,
      cuisineType: restaurant.cuisineType,
      imageUrl: restaurant.imageUrl,
      createdByUserId: restaurant.createdByUserId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }
}
