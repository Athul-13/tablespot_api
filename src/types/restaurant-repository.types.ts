/** Restaurant repository types (single responsibility: restaurant domain). */

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
  create(
    data: CreateRestaurantData,
    createdByUserId: string
  ): Promise<RestaurantEntity>;
  findById(id: string): Promise<RestaurantEntity | null>;
  update(id: string, data: UpdateRestaurantData): Promise<RestaurantEntity>;
  delete(id: string): Promise<void>;
  list(filters?: ListRestaurantsFilter): Promise<RestaurantEntity[]>;
}
