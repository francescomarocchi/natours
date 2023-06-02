import { injectable } from 'inversify';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../model/tour';
import { find } from '../utils/find';

@injectable()
export class ToursService {
  public getTours$(filter: ITour): Observable<ITour[]> {
    const query = find(Tour, filter);
    return from(query.exec());
  }

  public getTour$(id: string): Observable<ITour | null> {
    return from(Tour.findById(id).exec());
  }

  public createTour$(tour: ITour): Observable<ITour> {
    return from(Tour.create(tour));
  }

  public updateTour$(id: string, tour: ITour): Observable<ITour | null> {
    return from(Tour.findByIdAndUpdate(id, tour, { new: true, runValidators: true }));
  }

  public deleteTour$(id: string): Observable<ITour | null> {
    return from(Tour.findByIdAndDelete(id));
  }
}
