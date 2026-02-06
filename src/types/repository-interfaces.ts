/** Minimal user shape used by repository callers (e.g. AuthService). */
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  phone?: string | null;
}

/** Refresh token record with user included (e.g. for refresh flow). */
export interface RefreshTokenWithUser {
  id: string;
  userId: string;
  expiresAt: Date;
  user: UserEntity;
}

/** Password reset token record with user included. */
export interface PasswordResetTokenWithUser {
  id: string;
  userId: string;
  expiresAt: Date;
  user: UserEntity;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  updatePassword(id: string, passwordHash: string): Promise<UserEntity>;
}

export interface IRefreshTokenRepository {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export interface IPasswordResetTokenRepository {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenWithUser | null>;
  delete(id: string): Promise<void>;
}

// Restaurant
export interface RestaurantEntity {
  id: string;
  name: string;
  fullAddress: string;
  phone: string;
  cuisineType: string;
  imageUrl: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRestaurantData {
  name: string;
  fullAddress: string;
  phone: string;
  cuisineType: string;
  imageUrl?: string | null;
}

export interface UpdateRestaurantData {
  name?: string;
  fullAddress?: string;
  phone?: string;
  cuisineType?: string;
  imageUrl?: string | null;
}

export interface ListRestaurantsFilter {
  cuisineType?: string;
  limit?: number;
  offset?: number;
}

export interface IRestaurantRepository {
  create(data: CreateRestaurantData, createdByUserId: string): Promise<RestaurantEntity>;
  findById(id: string): Promise<RestaurantEntity | null>;
  update(id: string, data: UpdateRestaurantData): Promise<RestaurantEntity>;
  delete(id: string): Promise<void>;
  list(filters?: ListRestaurantsFilter): Promise<RestaurantEntity[]>;
}

// Comment
export interface CommentEntity {
  id: string;
  restaurantId: string;
  userId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string };
}

export interface ICommentRepository {
  create(restaurantId: string, userId: string, body: string): Promise<CommentEntity>;
  findByRestaurantId(restaurantId: string): Promise<CommentEntity[]>;
  findById(id: string): Promise<CommentEntity | null>;
  delete(id: string): Promise<void>;
}

// Rating
export interface RatingEntity {
  id: string;
  restaurantId: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRatingRepository {
  upsert(restaurantId: string, userId: string, stars: number): Promise<RatingEntity>;
  getByRestaurantId(restaurantId: string): Promise<RatingEntity[]>;
  getAverageRating(restaurantId: string): Promise<number>;
  getByRestaurantAndUser(restaurantId: string, userId: string): Promise<RatingEntity | null>;
}
