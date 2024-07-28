import { Observable, map, of } from 'rxjs';
import { PugTemplate } from '../model/pug-template';
import { controller } from '../utils/decorators/controller.decorator';
import { httpMethod } from '../utils/decorators/http-method.decorator';
import { params } from '../utils/decorators/parameters.decorator';
import { ToursService } from '../services/tours.service';
import { ITour } from '../model/tour';
import { authorize } from '../utils/decorators/authorize.decorator';
import { UserService } from '../services/users.service';

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
  constructor(private readonly toursService: ToursService, private readonly usersService: UserService) { }

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
      map((tour) => {
        if (!tour) {
          throw new Error(`Cannot find tour named ${slug}`)
        }
        return { title: `${tour?.name} tour`, tour }
      }),
      toPugTemplate('tour'),
    );
  }

  @httpMethod('get', '/login')
  public login(): Observable<PugTemplate> {
    return of({ title: 'Login' }).pipe(toPugTemplate('login'))
  }

  @authorize()
  @httpMethod('get', '/me')
  public me(): Observable<PugTemplate> {
    return of({ title: 'Your account' }).pipe(toPugTemplate('account'));
  }

  @authorize()
  @httpMethod('post', '/me')
  public submitUserData(
    @params('user') userId: string,
    @params('body') userData: { name: string, email: string }
  ): Observable<PugTemplate> {
    return this.usersService.update$(userId, { name: userData.name, email: userData.email }).pipe(
      map(user => ({ user, title: 'Your account' })),
      toPugTemplate('account')
    )
  }
}
