import { injectable } from 'inversify';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../model/tour';
import { find } from '../utils/find';
import { TourRatingAggregate } from '../model/tour-rating-aggregate';
import { TourMonthlyPlanAggregate } from '../model/tour-monthly-plan-aggregate';

@injectable()
export class ToursService {
  public getTours$(filter: ITour): Observable<ITour[]> {
    const query = find(Tour, filter);
    return from(query.exec());
  }

  public getTour$(id: string): Observable<ITour | null> {
    return from(Tour.findById(id).exec());
  }

  public getTourStatistics$(): Observable<TourRatingAggregate[]> {
    /**
     * This is the aggregation pipeline.
     * Each element is called STAGE.
     * Stage can be repeated, just to say it.
     */
    return from(
      Tour.aggregate<TourRatingAggregate>([
        { $match: { ratingsAverage: { $gte: 4.5 } } },
        {
          $group: {
            _id: { $toUpper: '$difficulty' },
            numRatings: { $sum: '$ratingsQuantity' },
            numTours: { $sum: 1 },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: { avgPrice: 1 },
        },
      ]).exec(),
    );
  }

  public getMonthlyPlan$(year: number): Observable<TourMonthlyPlanAggregate[]> {
    return from(
      Tour.aggregate<TourMonthlyPlanAggregate>([
        { $unwind: '$startDates' },
        {
          $match: {
            startDates: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$startDates' },
            numTourStarts: { $sum: 1 },
            tours: { $push: '$name' },
          },
        },
        {
          $addFields: { month: '$_id' },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        {
          $limit: 12,
        },
      ]).exec(),
    );
  }

  public createTour$(tour: ITour): Observable<ITour> {
    return from(Tour.create(tour));
  }

  public updateTour$(id: string, tour: ITour): Observable<ITour | null> {
    return from(
      Tour.findByIdAndUpdate(id, tour, { new: true, runValidators: true }),
    );
  }

  public deleteTour$(id: string): Observable<ITour | null> {
    return from(Tour.findByIdAndDelete(id));
  }
}
