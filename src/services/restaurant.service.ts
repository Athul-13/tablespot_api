import { injectable, inject } from "tsyringe";
import type {
  IRestaurantRepository,
  IRatingRepository,
  RestaurantEntity,
  CreateRestaurantData,
  UpdateRestaurantData,
  ListRestaurantsFilter,
} from "@/types/repository-interfaces";
import { RestaurantRepositoryToken, RatingRepositoryToken } from "@/di/tokens";
import { restaurantNotFound, forbidden } from "@/errors/restaurant";
import { IRestaurantService } from "./interface/restaurant-service.interface";

export interface RestaurantWithRating extends RestaurantEntity {
  averageRating: number;
}

@injectable()
export class RestaurantService implements IRestaurantService {
  constructor(
    @inject(RestaurantRepositoryToken)
    private readonly restaurantRepo: IRestaurantRepository,
    @inject(RatingRepositoryToken)
    private readonly ratingRepo: IRatingRepository
  ) {}

  async create(
    data: CreateRestaurantData,
    createdByUserId: string
  ): Promise<RestaurantEntity> {
    return this.restaurantRepo.create(data, createdByUserId);
  }

  async getById(id: string): Promise<RestaurantWithRating | null> {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) return null;
    const averageRating = await this.ratingRepo.getAverageRating(id);
    return { ...restaurant, averageRating };
  }

  async list(filters?: ListRestaurantsFilter): Promise<RestaurantWithRating[]> {
    const restaurants = await this.restaurantRepo.list(filters);
    const withRatings = await Promise.all(
      restaurants.map(async (r) => {
        const averageRating = await this.ratingRepo.getAverageRating(r.id);
        return { ...r, averageRating };
      })
    );
    return withRatings;
  }

  async update(
    id: string,
    data: UpdateRestaurantData,
    userId: string
  ): Promise<RestaurantEntity> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) throw restaurantNotFound();
    if (existing.createdByUserId !== userId) throw forbidden();
    return this.restaurantRepo.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) throw restaurantNotFound();
    if (existing.createdByUserId !== userId) throw forbidden();
    await this.restaurantRepo.delete(id);
  }
}
