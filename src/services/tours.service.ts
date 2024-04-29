import { injectable } from 'inversify';
import { Observable, from } from 'rxjs';
import { ITour, Tour } from '../model/tour';
import { TourRatingAggregate } from '../model/tour-rating-aggregate';
import { TourMonthlyPlanAggregate } from '../model/tour-monthly-plan-aggregate';
import { Rudi } from './rudi';

export enum Units {
  Mi = 'mi',
  Km = 'km',
}

const EARTH_RADIUS_MILES = 3963.2;
const EARTH_RADIUS_KILOMETERS = 6378.1;

@injectable()
export class ToursService extends Rudi<ITour> {
  constructor() {
    super(Tour);
  }

  public get$(id: string): Observable<ITour | null> {
    return from(this.model.findById(id).populate('reviews').exec());
  }

  public getToursWithin$(
    distance: number,
    latitude: number,
    longitude: number,
    unit: Units,
  ): Observable<ITour[]> {
    const radius =
      unit === Units.Mi
        ? distance / EARTH_RADIUS_MILES
        : distance / EARTH_RADIUS_KILOMETERS;
    return from(
      this.model
        .find({
          startLocation: {
            $geoWithin: {
              $centerSphere: [[longitude, latitude], radius],
            },
          },
        })
        .exec(),
    );
  }

  public getDistances$(
    latitude: number,
    longitude: number,
    unit: Units,
  ): Observable<ITour[]> {
    const multiplier = unit === Units.Km ? 0.001 : 0.000621371;

    return from(
      this.model.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier,
          },
        },
        {
          $project: {
            distance: 1,
            name: 1,
          },
        },
      ]),
    );
  }

  public getTourStatistics$(): Observable<TourRatingAggregate[]> {
    /**
     * This is the aggregation pipeline.
     * Each element is called STAGE.
     * Stage can be repeated, jut to say it.
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
