import type { RatingEntity } from "@/types/repository-interfaces";

export interface RestaurantRatingResult {
    averageRating: number;
    totalRatings: number;
    userRating: number | null;
  }

export interface IRatingService {
    setRating(restaurantId: string, userId: string, stars: number): Promise<RatingEntity>;

    getRating(restaurantId: string, userId?: string | null): Promise<RestaurantRatingResult>;
}