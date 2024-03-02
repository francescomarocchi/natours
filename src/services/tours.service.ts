import { injectable } from 'inversify';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../model/tour';
import { TourRatingAggregate } from '../model/tour-rating-aggregate';
import { TourMonthlyPlanAggregate } from '../model/tour-monthly-plan-aggregate';
import { Rudi } from './rudi';

@injectable()
export class ToursService extends Rudi<ITour> {
  constructor() {
    super(Tour);
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
}
