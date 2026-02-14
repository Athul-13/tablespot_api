import type { RequestHandler } from "express";
import { inject, injectable } from "tsyringe";
import { createCommentSchema } from "@/validation/restaurant";
import type { RestaurantError } from "@/errors/restaurant";
import { CommentServiceToken } from "@/di/tokens";
import { ICommentService } from "@/services/interface/comment-service.interface";

function isRestaurantError(e: unknown): e is RestaurantError {
  return e instanceof Error && e.name === "RestaurantError";
}

@injectable()
export class CommentController {
  constructor(
    @inject(CommentServiceToken) private readonly commentService: ICommentService
  ) {}

  add(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const restaurantId = req.params.restaurantId as string;
        const parsed = createCommentSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const comment = await this.commentService.add(
          restaurantId,
          req.user.id,
          parsed.data.body
        );
        res.status(201).json(comment);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  listByRestaurant(): RequestHandler {
    return async (req, res, next) => {
      try {
        const restaurantId = req.params.restaurantId as string;
        const comments =
          await this.commentService.listByRestaurant(restaurantId);
        res.json(comments);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  delete(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const commentId = req.params.commentId as string;
        await this.commentService.delete(commentId, req.user.id);
        res.status(204).send();
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
