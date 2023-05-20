import { inject } from "inversify";
import { Observable, tap } from "rxjs";
import { ITour } from "../../model/tour";
import { ToursService } from "../../services/tours.service";
import { controller } from "../../utils/decorators/controller.decorator";
import { httpMethod } from "../../utils/decorators/http-method.decorator";
import { params } from "../../utils/decorators/parameters.decorator";

@controller('/api/v1/tours')
export class ToursRouteHandler {
  constructor(
    @inject(ToursService) private readonly toursService: ToursService,
  ) { }

  @httpMethod('get', '/')
  public getTours(): Observable<ITour[]> {
    return this.toursService.getTours$().pipe(
      tap((tours) => {
        if (!tours) throw new Error("could not get tours");
      }),
    );
  }

  @httpMethod('get', '/:id')
  public getTour(@params('params', 'id') id: string): Observable<ITour | null> {
    return this.toursService.getTour$(id);
  }

  @httpMethod('post', '/')
  public createTour(@params('body') body: ITour): Observable<ITour> {
    return this.toursService.createTour$(body);
  }
}
