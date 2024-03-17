import { inject } from 'inversify';
import { Observable, tap } from 'rxjs';
import { ITour } from '../../model/tour';
import { TourMonthlyPlanAggregate } from '../../model/tour-monthly-plan-aggregate';
import { TourRatingAggregate } from '../../model/tour-rating-aggregate';
import { UserRoles } from '../../model/user';
import { ToursService } from '../../services/tours.service';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { RouterBinding } from '../../utils/types/newable-function-with-properties';

@controller('/api/v1/tours')
export class ToursController {
  constructor(
    @inject(ToursService) private readonly toursService: ToursService,
  ) { }

  public bindRouter(): RouterBinding {
    return { local: '/:tourId/reviews', target: '/api/v1/reviews' };
  }

  @httpMethod('get', '/')
  public getTours(@params('query') query: ITour): Observable<ITour[]> {
    return this.toursService.getList$(query).pipe(
      tap((tours) => {
        if (!tours) throw new Error('could not get tours');
      }),
    );
  }

  @httpMethod('get', '/:id')
  public getTour(@params('params', 'id') id: string): Observable<ITour | null> {
    return this.toursService.get$(id);
  }

  @httpMethod('get', '/top-5-cheap')
  public getTopCheapestFive(): Observable<ITour[]> {
    return this.toursService.getList$({
      sort: '-price -ratingsAverage',
      page: '1',
      limit: '5',
    } as unknown as ITour);
  }

  @httpMethod('get', '/tour-stats')
  public getTourStats(): Observable<TourRatingAggregate[]> {
    return this.toursService.getTourStatistics$();
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide, UserRoles.Guide])
  @httpMethod('get', '/monthly-plan/:year')
  public getMonthlyPlan(
    @params('params', 'year') year: string,
  ): Observable<TourMonthlyPlanAggregate[]> {
    return this.toursService.getMonthlyPlan$(+year);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('post', '/')
  public createTour(@params('body') tour: ITour): Observable<ITour> {
    return this.toursService.create$(tour);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('patch', '/:id')
  public updateTour(
    @params('body') tour: ITour,
    @params('params', 'id') id: string,
  ): Observable<ITour | null> {
    return this.toursService.update$(id, tour);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('delete', '/:id')
  public deleteTour(
    @params('params', 'id') id: string,
  ): Observable<ITour | null> {
    return this.toursService.delete$(id);
  }
}
