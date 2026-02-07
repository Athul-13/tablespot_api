import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  RestaurantEntity,
  CreateRestaurantData,
  UpdateRestaurantData,
  ListRestaurantsFilter,
} from "@/types/repository-interfaces";
import { RestaurantService } from "@/services/restaurant.service";
import { RestaurantError } from "@/errors/restaurant";

function makeRestaurant(
  overrides: Partial<RestaurantEntity> = {}
): RestaurantEntity {
  return {
    id: "rest-1",
    name: "Test Restaurant",
    fullAddress: "123 Main St",
    phone: "+1234567890",
    cuisineType: "Italian",
    imageUrl: null,
    createdByUserId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockRestaurantRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

const mockRatingRepo = {
  getAverageRating: vi.fn(),
  getByRestaurantId: vi.fn(),
  getByRestaurantAndUser: vi.fn(),
  upsert: vi.fn(),
};

describe("RestaurantService", () => {
  let service: RestaurantService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RestaurantService(
      mockRestaurantRepo as never,
      mockRatingRepo as never
    );
  });

  describe("create", () => {
    it("returns created restaurant", async () => {
      const data: CreateRestaurantData = {
        name: "New Place",
        fullAddress: "456 Oak Ave",
        phone: "+1987654321",
        cuisineType: "Mexican",
      };
      const created = makeRestaurant({
        id: "rest-new",
        ...data,
        createdByUserId: "user-1",
      });
      mockRestaurantRepo.create.mockResolvedValue(created);

      const result = await service.create(data, "user-1");

      expect(result).toEqual(created);
      expect(mockRestaurantRepo.create).toHaveBeenCalledWith(data, "user-1");
    });
  });

  describe("getById", () => {
    it("returns restaurant with averageRating when found", async () => {
      const restaurant = makeRestaurant();
      mockRestaurantRepo.findById.mockResolvedValue(restaurant);
      mockRatingRepo.getAverageRating.mockResolvedValue(4.5);

      const result = await service.getById("rest-1");

      expect(result).toEqual({ ...restaurant, averageRating: 4.5 });
      expect(mockRatingRepo.getAverageRating).toHaveBeenCalledWith("rest-1");
    });

    it("returns null when restaurant not found", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      const result = await service.getById("missing");

      expect(result).toBeNull();
      expect(mockRatingRepo.getAverageRating).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("returns restaurants with averageRating", async () => {
      const list = [
        makeRestaurant({ id: "a" }),
        makeRestaurant({ id: "b" }),
      ];
      mockRestaurantRepo.list.mockResolvedValue(list);
      mockRatingRepo.getAverageRating.mockImplementation((id: string) =>
        Promise.resolve(id === "a" ? 3 : 5)
      );

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].averageRating).toBe(3);
      expect(result[1].averageRating).toBe(5);
      expect(mockRestaurantRepo.list).toHaveBeenCalledWith(undefined);
    });

    it("passes filters to repository", async () => {
      mockRestaurantRepo.list.mockResolvedValue([]);
      const filters: ListRestaurantsFilter = {
        cuisineType: "Italian",
        limit: 10,
      };

      await service.list(filters);

      expect(mockRestaurantRepo.list).toHaveBeenCalledWith(filters);
    });
  });

  describe("update", () => {
    it("updates when user is creator", async () => {
      const existing = makeRestaurant({ createdByUserId: "user-1" });
      const data: UpdateRestaurantData = { name: "Updated Name" };
      const updated = makeRestaurant({
        ...existing,
        name: "Updated Name",
      });
      mockRestaurantRepo.findById.mockResolvedValue(existing);
      mockRestaurantRepo.update.mockResolvedValue(updated);

      const result = await service.update("rest-1", data, "user-1");

      expect(result).toEqual(updated);
      expect(mockRestaurantRepo.update).toHaveBeenCalledWith("rest-1", data);
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "X" }, "user-1")
      ).rejects.toThrow(RestaurantError);
      await expect(
        service.update("missing", { name: "X" }, "user-1")
      ).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockRestaurantRepo.update).not.toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user is not creator", async () => {
      const existing = makeRestaurant({ createdByUserId: "user-1" });
      mockRestaurantRepo.findById.mockResolvedValue(existing);

      await expect(
        service.update("rest-1", { name: "X" }, "other-user")
      ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
      expect(mockRestaurantRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes when user is creator", async () => {
      const existing = makeRestaurant({ createdByUserId: "user-1" });
      mockRestaurantRepo.findById.mockResolvedValue(existing);
      mockRestaurantRepo.delete.mockResolvedValue(undefined);

      await service.delete("rest-1", "user-1");

      expect(mockRestaurantRepo.delete).toHaveBeenCalledWith("rest-1");
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(service.delete("missing", "user-1")).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockRestaurantRepo.delete).not.toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user is not creator", async () => {
      const existing = makeRestaurant({ createdByUserId: "user-1" });
      mockRestaurantRepo.findById.mockResolvedValue(existing);

      await expect(service.delete("rest-1", "other-user")).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
      expect(mockRestaurantRepo.delete).not.toHaveBeenCalled();
    });
  });
});
