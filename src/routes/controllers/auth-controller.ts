import { Request, Response } from 'express';
import { inject } from 'inversify';
import { Observable, of } from 'rxjs';
import { AppError } from '../../model/error';
import { IUser } from '../../model/user';
import { UserService } from '../../services/users.service';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { ExtendedRequest } from '../../model/request';

@controller('/')
export class AuthController {
  constructor(@inject(UserService) private readonly userService: UserService) { }

  @httpMethod('post', '/signup')
  public signup(@params('body') user: IUser): Observable<IUser> {
    return this.userService.createUserAndToken$(user);
  }

  @httpMethod('post', '/login')
  public login(
    @params('body') credentials: { email: string; password: string },
    @params('response') response: Response,
  ): Observable<string | AppError> {
    const { email, password } = credentials;
    if (!email || !password) {
      throw new AppError(
        'Please provide correct email address and password',
        400,
      );
    }

    // TODO: this crap should be refactored (statusCode set in @httpMethod?)
    response.locals.statusCode = 200;
    return this.userService.login$(email, password);
  }

  @httpMethod('post', '/forgot-password')
  public forgotPassword(
    @params('body') email: { email: string },
  ): Observable<AppError | string> {
    if (!email?.email) {
      return of(new AppError('Please provide a valid email address', 400));
    }
    return this.userService.createResetToken$(email.email);
  }

  @httpMethod('patch', '/reset-password/:token')
  public resetPassword(
    @params('params', 'token') resetToken: string,
    @params('body') data: { password: string; passwordConfirm: string },
  ): Observable<string | AppError> {
    return this.userService.resetPassword$(
      resetToken,
      data.password,
      data.passwordConfirm,
    );
  }

  @authorize()
  @httpMethod('patch', '/change-password')
  public changePassword(
    @params('request') request: ExtendedRequest,
    @params('body')
    data: {
      currentPassword: string;
      password: string;
      passwordConfirm: string;
    },
  ): Observable<string | AppError> {
    return this.userService.changePassword$(
      request.locals.id,
      data.currentPassword,
      data.password,
      data.passwordConfirm,
    );
  }
}
