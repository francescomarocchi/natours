import { inject } from 'inversify';
import { Observable, tap } from 'rxjs';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { ReviewsService } from '../../services/reviews.service';
import { IReview } from '../../model/review';
import { User, UserRoles } from '../../model/user';

@controller('/api/v1/reviews', { mergeParams: true })
export class ReviewsController {
  constructor(
    @inject(ReviewsService) private readonly reviewsService: ReviewsService,
  ) { }

  @authorize([UserRoles.User])
  @httpMethod('get', '/')
  public getReviews(
    @params('query') query: IReview,
    @params('params', 'tourId') tourId: string,
  ): Observable<IReview[]> {
    if (tourId) {
      query.tour = tourId as any;
    }

    return this.reviewsService.getList$(query).pipe(
      tap((reviews) => {
        if (!reviews) throw new Error('could not get reviews');
      }),
    );
  }

  @authorize([UserRoles.User])
  @httpMethod('get', '/:id')
  public getReview(
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.get$(id);
  }

  @authorize([UserRoles.User])
  @httpMethod('post', '/')
  public createReview(
    @params('body') review: IReview,
    @params('params', 'tourId') tourId: string,
    @params('user') userId: string,
  ): Observable<IReview> {
    // When route merged from Tours
    if (tourId) {
      review.tour = tourId as any;
      review.user = userId as any;
    }

    return this.reviewsService.create$(review);
  }

  @authorize([UserRoles.User, UserRoles.Admin])
  @httpMethod('patch', '/:id')
  public updateReview(
    @params('body') review: IReview,
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.update$(id, review);
  }

  @authorize([UserRoles.User, UserRoles.Admin])
  @httpMethod('delete', '/:id')
  public deleteReview(
    @params('params', 'id') id: string,
  ): Observable<IReview | null> {
    return this.reviewsService.delete$(id);
  }
}
