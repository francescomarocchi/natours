import { injectable } from 'inversify';
import { IReview, Review } from '../model/review';
import { Rudi } from './rudi';

@injectable()
export class ReviewsService extends Rudi<IReview> {
  constructor() {
    super(Review);
  }
}
