import mongoose, { MongooseQueryMiddleware, Schema } from 'mongoose';
import { IUser } from './user';
import { ITour } from './tour';

export interface IReview {
  description: string;
  rating: number;
  createdAt: Date;
  user: IUser;
  tour: ITour;
}

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

const findQueryMiddleware: MongooseQueryMiddleware[] = [
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndUpdate',
  'findOneAndReplace',
];

reviewSchema.pre(findQueryMiddleware, function(next) {
  this.populate('user', 'name');
  next();
});

export const Review = mongoose.model('review', reviewSchema);
