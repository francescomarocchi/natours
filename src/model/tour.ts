import mongoose, { Schema } from 'mongoose';

export interface ITour {
  name: string;
  rating?: number;
  price: number;
}

const tourSchema = new Schema<ITour>({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: { type: Number, default: 4.5 },
  price: { type: Number, required: [true, 'A tour must have a price'] },
});

export const Tour = mongoose.model('tour', tourSchema);
