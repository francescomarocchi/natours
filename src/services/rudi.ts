import { Model } from 'mongoose';
import { Observable, from } from 'rxjs';
import { find } from '../utils/find';
import { WithQueryParams } from '../utils/types/with-query-params';

export class Rudi<T> {
  protected constructor(private readonly model: Model<T>) {}

  public getList$(filter: WithQueryParams<T>): Observable<T[]> {
    const query = find(this.model, filter);
    return from(query.exec());
  }

  public get$(id: string): Observable<T | null> {
    return from(this.model.findById(id).exec());
  }

  public create$(tour: T): Observable<T> {
    return from(this.model.create(tour));
  }

  public update$(id: string, tour: WithQueryParams<T>): Observable<T | null> {
    return from(
      this.model.findByIdAndUpdate(id, tour, {
        new: true,
        runValidators: true,
      }),
    );
  }

  public delete$(id: string): Observable<T | null> {
    return from(this.model.findByIdAndDelete(id));
  }
}