import fs from 'fs';
import { authorize } from '../../utils/decorators/authorize.decorator';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { UserRoles } from '../../model/user';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../../model/tour';

@controller('/api/v1/service')
export class ServiceController {
  @authorize([UserRoles.Admin])
  @httpMethod('post', '/import-tours')
  public importTours(): Observable<ITour> {
    const tours = JSON.parse(
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
}
