import fs from 'fs';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { IUser, User, UserRoles } from '../../model/user';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../../model/tour';
import { IReview, Review } from '../../model/review';

@controller('/api/v1/service')
export class ServiceController {
  @authorize([UserRoles.Admin])
  @httpMethod('post', '/import-tours')
  public importTours(): Observable<ITour[]> {
    const tours: ITour[] = JSON.parse(
      fs.readFileSync(
        `${__dirname}/../../../dev-data/data/tours.json`,
        'utf-8',
      ),
    );

    return from(Tour.create(tours));
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/delete-tours')
  public deleteTours(): Observable<any> {
    return from(Tour.deleteMany());
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/import-users')
  public importUsers(): Observable<IUser[]> {
    const users: IUser[] = JSON.parse(
      fs.readFileSync(
        `${__dirname}/../../../dev-data/data/users.json`,
        'utf-8',
      ),
    );

    return from(User.create(users, { validateBeforeSave: false }));
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/delete-users')
  public deleteUsers(): Observable<any> {
    return from(User.deleteMany());
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/import-reviews')
  public importReviews(): Observable<IReview[]> {
    const reviews: IReview[] = JSON.parse(
      fs.readFileSync(
        `${__dirname}/../../../dev-data/data/reviews.json`,
        'utf-8',
      ),
    );

    return from(Review.create(reviews));
  }

  @authorize([UserRoles.Admin])
  @httpMethod('post', '/delete-reviews')
  public deleteReviews(): Observable<any> {
    return from(Review.deleteMany());
  }
}
