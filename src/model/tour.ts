import mongoose, { Schema } from "mongoose";

export interface ITour {
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  rating?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  createdAt: Date;
  startDates: Date[];
}

const tourSchema = new Schema<ITour>({
  name: {
    type: String,
    required: [true, "A tour must have a name"],
    unique: true,
    trim: true,
  },
  duration: { type: Number, required: [true, "A tour must have a duration"] },
  maxGroupSize: {
    type: Number,
    required: [true, "A tour must have a group size"],
  },
  difficulty: {
    type: String,
    required: [true, "A tour must have a difficulty"],
  },
  ratingsAverage: { type: Number, default: 4.5 },
  ratingsQuantity: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  price: { type: Number, required: [true, "A tour must have a price"] },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, "A tour must have a description"],
  },
  description: { type: String, trim: true },
  imageCover: {
    type: String,
    required: [true, "A tour must have an image cover"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  startDates: [Date],
});

export const Tour = mongoose.model("tour", tourSchema);
