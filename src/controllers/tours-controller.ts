import { inject } from 'inversify';
import { Observable, of, tap } from 'rxjs';
import { controller } from '../utils/decorators/controller.decorator';
import { ToursService, Units } from '../services/tours.service';
import { RouterBinding } from '../utils/types/newable-function-with-properties';
import { httpMethod } from '../utils/decorators/http-method.decorator';
import { params } from '../utils/decorators/parameters.decorator';
import { ITour } from '../model/tour';
import { TourRatingAggregate } from '../model/tour-rating-aggregate';
import { AppError } from '../model/error';
import { authorize } from '../utils/decorators/authorize.decorator';
import { UserRoles } from '../model/user';
import { TourMonthlyPlanAggregate } from '../model/tour-monthly-plan-aggregate';

@controller('/api/v1/tours')
export class ToursController {
  constructor(
    @inject(ToursService) private readonly toursService: ToursService,
  ) {}

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

  @httpMethod('get', '/tours-within/:distance/center/:coords/unit/:unit')
  public getToursWithin(
    @params('params', 'distance') distance: number,
    @params('params', 'coords') coords: string,
    @params('params', 'unit') unit: Units,
  ): Observable<ITour[]> {
    const [latitude, longitude] = coords.split(',');
    if (
      [latitude, longitude].some((coordinate) => isNaN(parseInt(coordinate)))
    ) {
      throw new AppError(
        `latitude "${latitude}" or longitude "${longitude}" are invalid`,
        400,
      );
    }
    return this.toursService.getToursWithin$(
      distance,
      parseFloat(latitude),
      parseFloat(longitude),
      unit,
    );
  }

  @httpMethod('get', '/distances/:coords/unit/:unit')
  public getToursDistances(
    @params('params', 'coords') coords: string,
    @params('params', 'unit') unit: Units,
  ): Observable<ITour[]> {
    const [latitude, longitude] = coords.split(',');
    if (
      [latitude, longitude].some((coordinate) => isNaN(parseInt(coordinate)))
    ) {
      throw new AppError(
        `latitude "${latitude}" or longitude "${longitude}" are invalid`,
        400,
      );
    }
    return this.toursService.getDistances$(
      parseFloat(latitude),
      parseFloat(longitude),
      unit,
    );
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