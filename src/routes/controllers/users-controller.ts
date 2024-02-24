import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { UserService } from '../../services/users.service';
import { inject } from 'inversify';
import { ExtendedRequest } from '../../model/request';
import { Observable } from 'rxjs';
import { IUser, UserRoles } from '../../model/user';
import { AppError } from '../../model/error';
import { EMPTY } from '../../utils/types/empty';

@controller('/api/v1/users')
export class UsersController {
  constructor(@inject(UserService) private readonly userService: UserService) { }

  @authorize()
  @httpMethod('get', '/')
  public getUsers(): Observable<IUser | IUser[]> {
    return this.userService.getUsers$();
  }

  @authorize()
  @httpMethod('patch', '/update-authenticated-user')
  public updateAuthenticatedUser(
    @params('request') request: ExtendedRequest,
    @params('body') body: { name: string; email: string },
  ): Observable<AppError | IUser> {
    return this.userService.updateAuthenticatedUser$(
      request.locals.id,
      body.name,
      body.email,
    );
  }

  @authorize()
  @httpMethod('delete', '/delete-authenticated-user')
  public deleteAuthenticatedUser(
    @params('request') request: ExtendedRequest,
  ): Observable<AppError | EMPTY> {
    return this.userService.deleteUser$(request.locals.id);
  }
}
