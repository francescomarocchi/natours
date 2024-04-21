import { Model } from 'mongoose';
import { Observable, from } from 'rxjs';
import { find } from '../utils/find';
import { WithQueryParams } from '../utils/types/with-query-params';

export class Rudi<T> {
  protected constructor(protected readonly model: Model<T>) { }

  public getList$(filter: WithQueryParams<T>): Observable<T[]> {
    const query = find(this.model, filter).explain();
    return from(query.exec());
  }

  public get$(id: string): Observable<T | null> {
    return from(this.model.findById(id).exec());
  }

  public create$(review: T): Observable<T> {
    return from(this.model.create(review));
  }

  public update$(id: string, review: WithQueryParams<T>): Observable<T | null> {
    return from(
      this.model.findByIdAndUpdate(id, review, {
        new: true,
        runValidators: true,
      }),
    );
  }

  public delete$(id: string): Observable<T | null> {
    return from(this.model.findByIdAndDelete(id));
  }
}
