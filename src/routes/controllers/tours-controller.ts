import { inject } from 'inversify';
import { Observable, tap } from 'rxjs';
import { ITour } from '../../model/tour';
import { TourMonthlyPlanAggregate } from '../../model/tour-monthly-plan-aggregate';
import { TourRatingAggregate } from '../../model/tour-rating-aggregate';
import { ToursService } from '../../services/tours.service';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';

@controller('/api/v1/tours')
export class ToursController {
  constructor(
    @inject(ToursService) private readonly toursService: ToursService
  ) {
  }

  @authorize()
  @httpMethod('get', '/')
  public getTours(@params('query') query: ITour): Observable<ITour[]> {
    return this.toursService.getTours$(query).pipe(
      tap((tours) => {
        if (!tours) throw new Error('could not get tours');
      })
    );
  }

  @authorize()
  @httpMethod('get', '/:id')
  public getTour(@params('params', 'id') id: string): Observable<ITour | null> {
    return this.toursService.getTour$(id);
  }

  @httpMethod('get', '/top-5-cheap')
  public getTopCheapestFive(): Observable<ITour[]> {
    return this.toursService.getTours$({
      sort: '-price -ratingsAverage',
      page: '1',
      limit: '5'
    } as unknown as ITour);
  }

  @httpMethod('get', '/tour-stats')
  public getTourStats(): Observable<TourRatingAggregate[]> {
    return this.toursService.getTourStatistics$();
  }

  @httpMethod('get', '/monthly-plan/:year')
  public getMonthlyPlan(
    @params('params', 'year') year: string
  ): Observable<TourMonthlyPlanAggregate[]> {
    return this.toursService.getMonthlyPlan$(+year);
  }

  @httpMethod('post', '/')
  public createTour(@params('body') tour: ITour): Observable<ITour> {
    return this.toursService.createTour$(tour);
  }

  @httpMethod('patch', '/:id')
  public updateTour(
    @params('body') tour: ITour,
    @params('params', 'id') id: string
  ): Observable<ITour | null> {
    return this.toursService.updateTour$(id, tour);
  }

  @httpMethod('delete', '/:id')
  public deleteTour(
    @params('params', 'id') id: string
  ): Observable<ITour | null> {
    return this.toursService.deleteTour$(id);
  }
}
