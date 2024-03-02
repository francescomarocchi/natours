import { inject } from 'inversify';
import { Observable, tap } from 'rxjs';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { ReviewsService } from '../../services/reviews.service';
import { IReview } from '../../model/review';

@controller('/api/v1/reviews')
export class ReviewsController {
  constructor(
    @inject(ReviewsService) private readonly reviewsService: ReviewsService,
  ) {}

  @httpMethod('get', '/')
  public getReviews(@params('query') query: IReview): Observable<IReview[]> {
    return this.reviewsService.getList$(query).pipe(
      tap((reviews) => {
        if (!reviews) throw new Error('could not get reviews');
      }),
    );
  }

  @httpMethod('get', '/:id')
  public getReview(
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.get$(id);
  }

  @authorize()
  @httpMethod('post', '/')
  public createReview(@params('body') review: IReview): Observable<IReview> {
    return this.reviewsService.create$(review);
  }

  @authorize()
  @httpMethod('patch', '/:id')
  public updateReview(
    @params('body') review: IReview,
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.update$(id, review);
  }

  @authorize()
  @httpMethod('delete', '/:id')
  public deleteReview(
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.delete$(id);
  }
}
