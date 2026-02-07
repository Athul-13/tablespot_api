export {
  AuthError,
  invalidCredentials,
  invalidToken,
  tokenExpired,
  userNotFound,
  emailAlreadyExists,
} from "./auth";
export type { AuthErrorCode } from "./auth";

export {
  RestaurantError,
  restaurantNotFound,
  forbidden,
  commentNotFound,
  ratingInvalid,
} from "./restaurant";
export type { RestaurantErrorCode } from "./restaurant";
