/** Rating repository types (single responsibility: rating domain). */

export interface RatingEntity {
  id: string;
  restaurantId: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRatingRepository {
  upsert(
    restaurantId: string,
    userId: string,
    stars: number
  ): Promise<RatingEntity>;
  getByRestaurantId(restaurantId: string): Promise<RatingEntity[]>;
  getAverageRating(restaurantId: string): Promise<number>;
  getByRestaurantAndUser(
    restaurantId: string,
    userId: string
  ): Promise<RatingEntity | null>;
}
