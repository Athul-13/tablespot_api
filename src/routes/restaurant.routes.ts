import { Router } from "express";
import type { IJwtService } from "@/types/service-interfaces";
import { RestaurantController } from "@/controllers/restaurant.controller";
import { CommentController } from "@/controllers/comment.controller";
import { RatingController } from "@/controllers/rating.controller";
import { authMiddleware, requireAuthMiddleware } from "@/middleware/auth.middleware";

export function createRestaurantRoutes(
  restaurantController: RestaurantController,
  commentController: CommentController,
  ratingController: RatingController,
  jwtService: IJwtService
): Router {
  const router = Router();
  const auth = authMiddleware(jwtService);
  const requireAuth = requireAuthMiddleware();

  // List and create (no id)
  router.get("/", restaurantController.list());
  router.post("/", auth, requireAuth, restaurantController.create());

  // Nested comments (must be before /:id so /:restaurantId/comments matches)
  router.get("/:restaurantId/comments", commentController.listByRestaurant());
  router.post(
    "/:restaurantId/comments",
    auth,
    requireAuth,
    commentController.add()
  );
  router.delete(
    "/:restaurantId/comments/:commentId",
    auth,
    requireAuth,
    commentController.delete()
  );

  // Nested ratings
  router.get("/:restaurantId/ratings", ratingController.getRating());
  router.put(
    "/:restaurantId/ratings",
    auth,
    requireAuth,
    ratingController.setRating()
  );

  // Single restaurant by id (last so /:id does not capture nested paths)
  router.get("/:id", restaurantController.getById());
  router.patch("/:id", auth, requireAuth, restaurantController.update());
  router.delete("/:id", auth, requireAuth, restaurantController.delete());

  return router;
}
