import { injectable, inject } from "tsyringe";
import type {
  IRatingRepository,
  IRestaurantRepository,
  RatingEntity,
} from "@/types/repository-interfaces";
import { RatingRepositoryToken, RestaurantRepositoryToken } from "@/di/tokens";
import { restaurantNotFound, ratingInvalid } from "@/errors/restaurant";

const MIN_STARS = 1;
const MAX_STARS = 5;

export interface RestaurantRatingResult {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
}

@injectable()
export class RatingService {
  constructor(
    @inject(RatingRepositoryToken)
    private readonly ratingRepo: IRatingRepository,
    @inject(RestaurantRepositoryToken)
    private readonly restaurantRepo: IRestaurantRepository
  ) {}

  async setRating(
    restaurantId: string,
    userId: string,
    stars: number
  ): Promise<RatingEntity> {
    if (stars < MIN_STARS || stars > MAX_STARS || !Number.isInteger(stars)) {
      throw ratingInvalid();
    }
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw restaurantNotFound();
    return this.ratingRepo.upsert(restaurantId, userId, stars);
  }

  async getRating(
    restaurantId: string,
    userId?: string | null
  ): Promise<RestaurantRatingResult> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw restaurantNotFound();
    const averageRating = await this.ratingRepo.getAverageRating(restaurantId);
    const ratings = await this.ratingRepo.getByRestaurantId(restaurantId);
    const totalRatings = ratings.length;
    let userRating: number | null = null;
    if (userId) {
      const userRatingEntity = await this.ratingRepo.getByRestaurantAndUser(
        restaurantId,
        userId
      );
      if (userRatingEntity) userRating = userRatingEntity.stars;
    }
    return { averageRating, totalRatings, userRating };
  }
}
