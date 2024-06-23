import { controller } from '../../utils/decorators/controller.decorator';
import { PugTemplate } from '../../model/pug-template';
import { Observable, map, of, tap } from 'rxjs';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { ToursService } from '../../services/tours.service';
import { ITour } from '../../model/tour';
import { params } from '../../utils/decorators/parameters.decorator';

const toPugTemplate =
  (template: string) =>
    (source$: Observable<unknown>): Observable<PugTemplate> =>
      source$.pipe(map((data) => new PugTemplate(template, data)));

/*
 * For some weird reason using a / as controller
 * forces the homePage to be called twice. Why???
 */
@controller('')
export class ViewsController {
  constructor(private readonly toursService: ToursService) { }

  @httpMethod('get', '/')
  public overview(): Observable<PugTemplate> {
    // Get tour data from collection
    // BUild template
    // Render template using tour data
    return this.toursService.getList$({} as ITour).pipe(
      map((tours) => ({
        title: 'All Tours',
        tours,
      })),
      toPugTemplate('overview'),
    );
  }

  @httpMethod('get', '/tour/:slug')
  public tour(@params('params', 'slug') slug: string): Observable<PugTemplate> {
    const tour$ = this.toursService.getBySlug$(slug);
    return tour$.pipe(
      map((tour) => ({ title: `${tour?.name} tour`, tour })),
      tap(console.log),
      toPugTemplate('tour'),
    );
  }

  @httpMethod('get', '/login')
  public login(): Observable<PugTemplate> {
    return of(void 0).pipe(toPugTemplate('login'))
  }

}
