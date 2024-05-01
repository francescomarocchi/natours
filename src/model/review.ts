import mongoose, { MongooseQueryMiddleware, Schema } from 'mongoose';
import { IUser } from './user';
import { ITour, Tour } from './tour';

export interface IReview {
  description: string;
  rating: number;
  createdAt: Date;
  user: IUser;
  tour: ITour;
}

const findByIdAndUpdateOrDeleteQueryMiddleware: MongooseQueryMiddleware[] = [
  'findOneAndDelete',
  'findOneAndUpdate',
];

const findQueryMiddleware: MongooseQueryMiddleware[] = [
  'find',
  'findOne',
  'findOneAndRemove',
  'findOneAndReplace',
  ...findByIdAndUpdateOrDeleteQueryMiddleware,
];

const reviewSchema = new Schema<IReview>(
  {
    description: {
      type: String,
      required: [true, 'A review must have a description!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must be rated!'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: [true, 'A review must specify the user who wrote it!'],
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'tour',
      required: [true, 'Review must specify a tour!'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(findQueryMiddleware, function (next) {
  this.populate('user', 'name photo');
  next();
});

reviewSchema.statics.calcAverageRatings = async function (
  tourId: string,
): Promise<void> {
  const reviewStatistics = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        count: { $sum: 1 },
        average: { $avg: '$rating' },
      },
    },
  ]);

  const hasReviews = reviewStatistics.length > 0;

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: hasReviews ? reviewStatistics[0].count : 0,
    ratingsAverage: hasReviews ? reviewStatistics[0].average : 4.5,
  });
};

// After creating a new review the tour statistic has to be udpated
reviewSchema.post('save', function (): void {
  const _this = <any>this;
  _this.constructor.calcAverageRatings(this.tour);
});

// Very controversial, but easy after all.
// In case of update and delete we want to update tour statistics.
// When updating it's easy, just get it on post update and trick is done.
// But when deleting after deletion there is no review to query for, so the
// tour id has to be gathered before actuating and then update has to be done
// after (so that if deleting an entry the entry is not there anymore)
reviewSchema.pre(
  findByIdAndUpdateOrDeleteQueryMiddleware,
  async function (next) {
    const id = this.getQuery()._id.toString();
    const review = await Review.findById(id);
    (<any>this)['review'] = review;
  },
);

reviewSchema.post(
  findByIdAndUpdateOrDeleteQueryMiddleware,
  async function (): Promise<void> {
    const review = (<any>this)['review'];
    if (review) await (<any>review.constructor).calcAverageRatings(review.tour);
  },
);

export const Review = mongoose.model('review', reviewSchema);
