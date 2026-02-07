import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RatingEntity, RestaurantEntity } from "@/types/repository-interfaces";
import { RatingService } from "@/services/rating.service";
import { RestaurantError } from "@/errors/restaurant";

function makeRestaurant(overrides: Partial<RestaurantEntity> = {}): RestaurantEntity {
  return {
    id: "rest-1",
    name: "Test",
    fullAddress: "123 St",
    phone: "+1",
    cuisineType: "Italian",
    imageUrl: null,
    createdByUserId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRating(overrides: Partial<RatingEntity> = {}): RatingEntity {
  return {
    id: "rating-1",
    restaurantId: "rest-1",
    userId: "user-1",
    stars: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockRatingRepo = {
  upsert: vi.fn(),
  getAverageRating: vi.fn(),
  getByRestaurantId: vi.fn(),
  getByRestaurantAndUser: vi.fn(),
};

const mockRestaurantRepo = {
  findById: vi.fn(),
};

describe("RatingService", () => {
  let service: RatingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RatingService(
      mockRatingRepo as never,
      mockRestaurantRepo as never
    );
  });

  describe("setRating", () => {
    it("upserts rating when restaurant exists and stars valid", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      const rating = makeRating({ stars: 5 });
      mockRatingRepo.upsert.mockResolvedValue(rating);

      const result = await service.setRating("rest-1", "user-1", 5);

      expect(result).toEqual(rating);
      expect(mockRatingRepo.upsert).toHaveBeenCalledWith("rest-1", "user-1", 5);
    });

    it("throws RATING_INVALID when stars below 1", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());

      await expect(service.setRating("rest-1", "user-1", 0)).rejects.toMatchObject({
        code: "RATING_INVALID",
        statusCode: 400,
      });
      expect(mockRatingRepo.upsert).not.toHaveBeenCalled();
    });

    it("throws RATING_INVALID when stars above 5", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());

      await expect(service.setRating("rest-1", "user-1", 6)).rejects.toMatchObject({
        code: "RATING_INVALID",
        statusCode: 400,
      });
      expect(mockRatingRepo.upsert).not.toHaveBeenCalled();
    });

    it("throws RATING_INVALID when stars is not an integer", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());

      await expect(service.setRating("rest-1", "user-1", 3.5)).rejects.toMatchObject({
        code: "RATING_INVALID",
        statusCode: 400,
      });
      expect(mockRatingRepo.upsert).not.toHaveBeenCalled();
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(service.setRating("missing", "user-1", 4)).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockRatingRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe("getRating", () => {
    it("returns averageRating, totalRatings, and userRating when user provided", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      mockRatingRepo.getAverageRating.mockResolvedValue(4.2);
      mockRatingRepo.getByRestaurantId.mockResolvedValue([
        makeRating({ stars: 4 }),
        makeRating({ id: "r2", userId: "u2", stars: 5 }),
      ]);
      mockRatingRepo.getByRestaurantAndUser.mockResolvedValue(makeRating({ stars: 4 }));

      const result = await service.getRating("rest-1", "user-1");

      expect(result).toEqual({
        averageRating: 4.2,
        totalRatings: 2,
        userRating: 4,
      });
      expect(mockRatingRepo.getByRestaurantAndUser).toHaveBeenCalledWith(
        "rest-1",
        "user-1"
      );
    });

    it("returns userRating null when user has not rated", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      mockRatingRepo.getAverageRating.mockResolvedValue(0);
      mockRatingRepo.getByRestaurantId.mockResolvedValue([]);
      mockRatingRepo.getByRestaurantAndUser.mockResolvedValue(null);

      const result = await service.getRating("rest-1", "user-1");

      expect(result.userRating).toBeNull();
      expect(result.averageRating).toBe(0);
      expect(result.totalRatings).toBe(0);
    });

    it("returns result without userRating when userId not provided", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      mockRatingRepo.getAverageRating.mockResolvedValue(3.5);
      mockRatingRepo.getByRestaurantId.mockResolvedValue([makeRating()]);

      const result = await service.getRating("rest-1");

      expect(result).toEqual({
        averageRating: 3.5,
        totalRatings: 1,
        userRating: null,
      });
      expect(mockRatingRepo.getByRestaurantAndUser).not.toHaveBeenCalled();
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(service.getRating("missing")).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
    });
  });
});
