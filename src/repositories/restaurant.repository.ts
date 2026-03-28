import { injectable } from "tsyringe";
import { Prisma, PrismaClient } from "@prisma/client";
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
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
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
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
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
    if (filters?.sort === "nearest" && filters.lat !== undefined && filters.lng !== undefined) {
      return this.listNearest(filters);
    }
    const where: Prisma.RestaurantWhereInput = {
      ...(filters?.cuisineType !== undefined && {
        cuisineType: filters.cuisineType,
      }),
      ...(filters?.q !== undefined &&
        filters.q.length > 0 && {
          name: { contains: filters.q, mode: "insensitive" },
        }),
    };
    const restaurants = await this.prisma.restaurant.findMany({
      where,
      take: filters?.limit ?? undefined,
      skip: filters?.offset ?? undefined,
      orderBy: { createdAt: "desc" },
    });
    return restaurants.map((r) => this.toEntity(r));
  }

  private async listNearest(filters: ListRestaurantsFilter): Promise<RestaurantEntity[]> {
    const lat = filters.lat as number;
    const lng = filters.lng as number;
    const query = Prisma.sql`
      SELECT
        r."id",
        r."name",
        r."fullAddress",
        r."phone",
        r."cuisineType",
        r."imageUrl",
        r."latitude",
        r."longitude",
        r."createdByUserId",
        r."createdAt",
        r."updatedAt"
      FROM "Restaurant" r
      WHERE 1 = 1
      ${
        filters.cuisineType
          ? Prisma.sql`AND r."cuisineType" = ${filters.cuisineType}`
          : Prisma.empty
      }
      ${
        filters.q !== undefined && filters.q.length > 0
          ? Prisma.sql`AND position(lower(${filters.q}) in lower(r."name")) > 0`
          : Prisma.empty
      }
      ${
        filters.maxDistanceKm !== undefined
          ? Prisma.sql`
              AND (
                r."latitude" IS NULL
                OR r."longitude" IS NULL
                OR (
                  6371 * acos(
                    LEAST(1, GREATEST(-1,
                      cos(radians(${lat})) * cos(radians(r."latitude")) *
                      cos(radians(r."longitude") - radians(${lng})) +
                      sin(radians(${lat})) * sin(radians(r."latitude"))
                    ))
                  )
                ) <= ${filters.maxDistanceKm}
              )
            `
          : Prisma.empty
      }
      ORDER BY
        CASE WHEN r."latitude" IS NULL OR r."longitude" IS NULL THEN 1 ELSE 0 END ASC,
        CASE
          WHEN r."latitude" IS NULL OR r."longitude" IS NULL THEN NULL
          ELSE 6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${lat})) * cos(radians(r."latitude")) *
              cos(radians(r."longitude") - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(r."latitude"))
            ))
          )
        END ASC,
        r."createdAt" DESC
      ${filters.limit !== undefined ? Prisma.sql`LIMIT ${filters.limit}` : Prisma.empty}
      ${filters.offset !== undefined ? Prisma.sql`OFFSET ${filters.offset}` : Prisma.empty}
    `;

    const restaurants = await this.prisma.$queryRaw<Array<{
      id: string;
      name: string;
      fullAddress: string;
      phone: string;
      cuisineType: string;
      imageUrl: string | null;
      latitude: number | null;
      longitude: number | null;
      createdByUserId: string;
      createdAt: Date;
      updatedAt: Date;
    }>>(query);
    return restaurants.map((r) => this.toEntity(r));
  }

  private toEntity(restaurant: {
    id: string;
    name: string;
    fullAddress: string;
    phone: string;
    cuisineType: string;
    imageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
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
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      createdByUserId: restaurant.createdByUserId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }
}
