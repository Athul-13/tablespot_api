import type { RequestHandler } from "express";
import { injectable } from "tsyringe";
import { RatingService } from "@/services/rating.service";
import { setRatingSchema } from "@/validation/restaurant";
import type { RestaurantError } from "@/errors/restaurant";

function isRestaurantError(e: unknown): e is RestaurantError {
  return e instanceof Error && e.name === "RestaurantError";
}

@injectable()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  setRating(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const restaurantId = req.params.restaurantId as string;
        const parsed = setRatingSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const rating = await this.ratingService.setRating(
          restaurantId,
          req.user.id,
          parsed.data.stars
        );
        res.status(200).json(rating);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  getRating(): RequestHandler {
    return async (req, res, next) => {
      try {
        const restaurantId = req.params.restaurantId as string;
        const userId = req.user?.id ?? null;
        const result = await this.ratingService.getRating(
          restaurantId,
          userId
        );
        res.json(result);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }
}
