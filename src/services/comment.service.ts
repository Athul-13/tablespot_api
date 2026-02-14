import { injectable, inject } from "tsyringe";
import type {
  ICommentRepository,
  IRestaurantRepository,
  CommentEntity,
} from "@/types/repository-interfaces";
import { CommentRepositoryToken, RestaurantRepositoryToken } from "@/di/tokens";
import { restaurantNotFound, commentNotFound, forbidden } from "@/errors/restaurant";
import { ICommentService } from "./interface/comment-service.interface";

@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(CommentRepositoryToken)
    private readonly commentRepo: ICommentRepository,
    @inject(RestaurantRepositoryToken)
    private readonly restaurantRepo: IRestaurantRepository
  ) {}

  async add(
    restaurantId: string,
    userId: string,
    body: string
  ): Promise<CommentEntity> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw restaurantNotFound();
    return this.commentRepo.create(restaurantId, userId, body);
  }

  async listByRestaurant(restaurantId: string): Promise<CommentEntity[]> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw restaurantNotFound();
    return this.commentRepo.findByRestaurantId(restaurantId);
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) throw commentNotFound();
    if (comment.userId !== userId) throw forbidden();
    await this.commentRepo.delete(commentId);
  }
}
