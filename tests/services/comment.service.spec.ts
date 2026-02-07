import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CommentEntity, RestaurantEntity } from "@/types/repository-interfaces";
import { CommentService } from "@/services/comment.service";
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

function makeComment(overrides: Partial<CommentEntity> = {}): CommentEntity {
  return {
    id: "comment-1",
    restaurantId: "rest-1",
    userId: "user-1",
    body: "Great food!",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockCommentRepo = {
  create: vi.fn(),
  findByRestaurantId: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
};

const mockRestaurantRepo = {
  findById: vi.fn(),
};

describe("CommentService", () => {
  let service: CommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommentService(
      mockCommentRepo as never,
      mockRestaurantRepo as never
    );
  });

  describe("add", () => {
    it("creates comment when restaurant exists", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      const comment = makeComment({ id: "comment-new", body: "Nice!" });
      mockCommentRepo.create.mockResolvedValue(comment);

      const result = await service.add("rest-1", "user-1", "Nice!");

      expect(result).toEqual(comment);
      expect(mockCommentRepo.create).toHaveBeenCalledWith("rest-1", "user-1", "Nice!");
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(service.add("missing", "user-1", "Hi")).rejects.toThrow(RestaurantError);
      await expect(service.add("missing", "user-1", "Hi")).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockCommentRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("listByRestaurant", () => {
    it("returns comments when restaurant exists", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(makeRestaurant());
      const comments = [makeComment(), makeComment({ id: "c2" })];
      mockCommentRepo.findByRestaurantId.mockResolvedValue(comments);

      const result = await service.listByRestaurant("rest-1");

      expect(result).toEqual(comments);
      expect(mockCommentRepo.findByRestaurantId).toHaveBeenCalledWith("rest-1");
    });

    it("throws RESTAURANT_NOT_FOUND when restaurant does not exist", async () => {
      mockRestaurantRepo.findById.mockResolvedValue(null);

      await expect(service.listByRestaurant("missing")).rejects.toMatchObject({
        code: "RESTAURANT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockCommentRepo.findByRestaurantId).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes when user is comment author", async () => {
      const comment = makeComment({ userId: "user-1" });
      mockCommentRepo.findById.mockResolvedValue(comment);
      mockCommentRepo.delete.mockResolvedValue(undefined);

      await service.delete("comment-1", "user-1");

      expect(mockCommentRepo.delete).toHaveBeenCalledWith("comment-1");
    });

    it("throws COMMENT_NOT_FOUND when comment does not exist", async () => {
      mockCommentRepo.findById.mockResolvedValue(null);

      await expect(service.delete("missing", "user-1")).rejects.toMatchObject({
        code: "COMMENT_NOT_FOUND",
        statusCode: 404,
      });
      expect(mockCommentRepo.delete).not.toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user is not comment author", async () => {
      const comment = makeComment({ userId: "author-1" });
      mockCommentRepo.findById.mockResolvedValue(comment);

      await expect(service.delete("comment-1", "other-user")).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
      expect(mockCommentRepo.delete).not.toHaveBeenCalled();
    });
  });
});
