import { inject } from 'inversify';
import { BehaviorSubject, catchError, from, Observable, of, switchMap } from 'rxjs';
import { controller } from '../utils/decorators/controller.decorator';
import { UserService } from '../services/users.service';
import { authorize } from '../utils/decorators/authorize.decorator';
import { IUser, UserRoles } from '../model/user';
import { httpMethod } from '../utils/decorators/http-method.decorator';
import { params } from '../utils/decorators/parameters.decorator';
import { AppError } from '../model/error';
import { EMPTY } from '../utils/types/empty';
import { FileArray, UploadedFile } from 'express-fileupload';
import path from 'path';

@controller('/api/v1/users')
export class UsersController {
  constructor(@inject(UserService) private readonly userService: UserService) { }

  @authorize([UserRoles.Admin])
  @httpMethod('get', '/')
  public getUsers(@params('query') query: IUser): Observable<IUser | IUser[]> {
    return this.userService.getList$(query);
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/')
  public createUser(@params('body') user: IUser): Observable<IUser | IUser[]> {
    return this.userService.create$(user);
  }

  @authorize([UserRoles.Admin])
  @httpMethod('get', ':id')
  public getUser(@params('params', 'id') id: string): Observable<IUser | null> {
    return this.userService.get$(id);
  }

  @authorize([UserRoles.Admin])
  @httpMethod('patch', '/:id')
  public updateUser(
    @params('body') user: IUser,
    @params('params', 'id') id: string,
  ): Observable<IUser | null> {
    return this.userService.update$(id, user);
  }

  @authorize([UserRoles.Admin])
  @httpMethod('delete', '/:id')
  public deleteUser(
    @params('params', 'id') id: string
  ): Observable<IUser | null> {
    return this.userService.delete$(id);
  }

  @authorize()
  @httpMethod('get', '/me')
  public getCurrentUser(
    @params('user') userId: string,
  ): Observable<IUser | null> {
    return this.userService.get$(userId);
  }

  @authorize()
  @httpMethod('patch', '/me/update-authenticated-user')
  public updateAuthenticatedUser(
    @params('user') userId: string,
    @params('body') body: { name: string; email: string },
    @params('files') files: FileArray
  ): Observable<AppError | IUser> {
    const photo = files.photo as UploadedFile;

    if (photo) {
      const main = path.dirname(require.main?.filename ?? '');
      const uploadPath = main + '/../public/img/users/uploaded/' + photo.name;
      
      return from(photo.mv(uploadPath)).pipe(switchMap(() => {
        return this.userService.updateAuthenticatedUser$(
          userId,
          body.name,
          body.email,
          `uploaded/${photo.name}`
        )
      }));
    }

    return this.userService.updateAuthenticatedUser$(
      userId,
      body.name,
      body.email,
    );
  }

  @authorize()
  @httpMethod('delete', '/me/delete-authenticated-user')
  public deleteAuthenticatedUser(
    @params('user') userId: string,
  ): Observable<AppError | EMPTY> {
    return this.userService.deleteUser$(userId);
  }
}
