export class RestaurantError extends Error {
  constructor(
    message: string,
    public readonly code: RestaurantErrorCode,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "RestaurantError";
    Object.setPrototypeOf(this, RestaurantError.prototype);
  }
}

export type RestaurantErrorCode =
  | "RESTAURANT_NOT_FOUND"
  | "FORBIDDEN"
  | "COMMENT_NOT_FOUND"
  | "RATING_INVALID";

export function restaurantNotFound(): RestaurantError {
  return new RestaurantError(
    "Restaurant not found",
    "RESTAURANT_NOT_FOUND",
    404
  );
}

export function forbidden(): RestaurantError {
  return new RestaurantError(
    "You are not allowed to perform this action",
    "FORBIDDEN",
    403
  );
}

export function commentNotFound(): RestaurantError {
  return new RestaurantError(
    "Comment not found",
    "COMMENT_NOT_FOUND",
    404
  );
}

export function ratingInvalid(): RestaurantError {
  return new RestaurantError(
    "Rating must be between 1 and 5",
    "RATING_INVALID",
    400
  );
}
