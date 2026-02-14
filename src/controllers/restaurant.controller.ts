import type { RequestHandler } from "express";
import { inject, injectable } from "tsyringe";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "@/validation/restaurant";
import type { RestaurantError } from "@/errors/restaurant";
import { RestaurantServiceToken } from "@/di/tokens";
import { IRestaurantService } from "@/services/interface/restaurant-service.interface";

function isRestaurantError(e: unknown): e is RestaurantError {
  return e instanceof Error && e.name === "RestaurantError";
}

function parseListQuery(req: { query: Record<string, unknown> }) {
  const q = req.query;
  const cuisineType =
    typeof q.cuisineType === "string" && q.cuisineType.trim().length > 0
      ? q.cuisineType.trim()
      : undefined;
  const limit =
    typeof q.limit === "string" && /^\d+$/.test(q.limit)
      ? parseInt(q.limit, 10)
      : undefined;
  const offset =
    typeof q.offset === "string" && /^\d+$/.test(q.offset)
      ? parseInt(q.offset, 10)
      : undefined;
  return { cuisineType, limit, offset };
}

@injectable()
export class RestaurantController {
  constructor(
    @inject(RestaurantServiceToken) private readonly restaurantService: IRestaurantService
  ) {}

  create(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const parsed = createRestaurantSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const restaurant = await this.restaurantService.create(
          parsed.data,
          req.user.id
        );
        res.status(201).json(restaurant);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  getById(): RequestHandler {
    return async (req, res, next) => {
      try {
        const id = req.params.id as string;
        const restaurant = await this.restaurantService.getById(id);
        if (!restaurant) {
          res.status(404).json({ error: "Restaurant not found" });
          return;
        }
        res.json(restaurant);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  list(): RequestHandler {
    return async (req, res, next) => {
      try {
        const { cuisineType, limit, offset } = parseListQuery(req);
        const filters =
          cuisineType !== undefined ||
          limit !== undefined ||
          offset !== undefined
            ? { cuisineType, limit, offset }
            : undefined;
        const restaurants = await this.restaurantService.list(filters);
        res.json(restaurants);
      } catch (e) {
        if (isRestaurantError(e)) {
          res.status(e.statusCode).json({ error: e.message });
          return;
        }
        next(e);
      }
    };
  }

  update(): RequestHandler {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const id = req.params.id as string;
        const parsed = updateRestaurantSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const restaurant = await this.restaurantService.update(
          id,
          parsed.data,
          req.user.id
        );
        res.json(restaurant);
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
        const id = req.params.id as string;
        await this.restaurantService.delete(id, req.user.id);
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
