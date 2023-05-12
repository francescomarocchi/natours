import { inject } from 'inversify';
import { Observable, map, take, tap } from 'rxjs';
import { ToursService } from '../../services/tours.service';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { Tour } from '../interfaces/tour';

@controller('/api/v1/tours')
export class ToursRouteHandler {
  constructor(@inject(ToursService) private readonly toursService: ToursService) {}

  @httpMethod('get', '/')
  public getTours(): Observable<Tour[]> {
    return this.toursService.getTours$().pipe(
      tap((tours) => {
        if (!tours) throw new Error('could not get tours');
      }),
      take(1)
    );
  }

  @httpMethod('get', '/:id')
  public getTour(@params('params', 'id') id: string): Observable<Tour | undefined> {
    return this.toursService.getTours$().pipe(
      map((tours: Tour[]) => tours.find((tour: Tour) => tour.id === Number(id))),
      take(1)
    );
  }
}
