/** Comment repository types (single responsibility: comment domain). */

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
  create(
    restaurantId: string,
    userId: string,
    body: string
  ): Promise<CommentEntity>;
  findByRestaurantId(restaurantId: string): Promise<CommentEntity[]>;
  findById(id: string): Promise<CommentEntity | null>;
  delete(id: string): Promise<void>;
}
