import { CreateRestaurantData, ListRestaurantsFilter, RestaurantEntity, UpdateRestaurantData } from "@/types/restaurant-repository.types";
import { RestaurantWithRating } from "../restaurant.service";



export interface IRestaurantService {
    create(data: CreateRestaurantData, createdByUserId: string): Promise<RestaurantEntity>;
    getById(id: string): Promise<RestaurantWithRating | null>;
    list(filters?: ListRestaurantsFilter): Promise<RestaurantWithRating[]>;
    update(id: string, data: UpdateRestaurantData, userId: string): Promise<RestaurantEntity>;
    delete(id: string, userId: string): Promise<void>;
}