import { CommentEntity } from "@/types/repository-interfaces";

export interface ICommentService {
    add(restaurantId: string, userId: string, body: string): Promise<CommentEntity>;

    listByRestaurant(restaurantId: string): Promise<CommentEntity[]>;

    delete(commentId: string, userId: string): Promise<void>;
}