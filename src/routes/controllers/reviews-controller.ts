import { inject } from 'inversify';
import { Observable, tap } from 'rxjs';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { ReviewsService } from '../../services/reviews.service';
import { IReview } from '../../model/review';
import { UserRoles } from '../../model/user';

@controller('/api/v1/reviews', { mergeParams: true })
export class ReviewsController {
  constructor(
    @inject(ReviewsService) private readonly reviewsService: ReviewsService,
  ) { }

  @httpMethod('get', '/')
  public getReviews(
    @params('query') query: IReview,
    @params('params', 'tourId') tourId: string,
  ): Observable<IReview[]> {
    // When route merged from Tours
    // TODO: this (and the one below) could be shifted in a new decorator
    //       that will add a new route.use before the actual handler to merge
    //       the tour Id inside the body somehow?
    if (tourId) {
      query.tour = tourId as any;
    }

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
