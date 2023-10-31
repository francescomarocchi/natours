import { NextFunction, Request, Response } from 'express';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { IUser, User } from '../../model/user';
import { Observable, from, map } from 'rxjs';

const users = [
  { id: 1, name: 'beavis' },
  { id: 2, name: 'butthead' },
];

@controller('/api/v1/users')
export class UsersController {
  @httpMethod('get', '/')
  private getUsers(): Observable<unknown> {
    return from(User.find());
  }

  @httpMethod('post', '/')
  private createUser(request: Request, response: Response, next: NextFunction): void {
    throw new Error('Post not implemented yet');
  }

  @httpMethod('get', '/:id')
  public getUser(@params('params', 'id') id: string): unknown {
    return users.find((u) => u.id === Number(id));
  }

  @httpMethod('patch', '/:id')
  private updateUser(request: Request, response: Response, next: NextFunction): void {
    throw new Error('not implemented yet');
  }

  @httpMethod('delete', '/:id')
  private deleteUser(request: Request, response: Response, next: NextFunction): void {
    throw new Error('delete not implemented yet');
  }
}
