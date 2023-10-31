import mongoose, { MongooseQueryMiddleware, Schema } from "mongoose";
import slugify from "slugify";

export interface ITour {
	name: string;
	slug: string;
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
	secretTour?: Boolean;
}

const tourSchema = new Schema<ITour>(
	{
		name: {
			type: String,
			required: [true, "A tour must have a name"],
			unique: true,
			trim: true,
			maxlength: [40, "A Tour name must have less or equal than 40 characters"],
			minlength: [10, "A Tour name must have more or equal than 10 characters"],
		},
		slug: String,
		duration: { type: Number, required: [true, "A tour must have a duration"] },
		maxGroupSize: {
			type: Number,
			required: [true, "A tour must have a group size"],
		},
		difficulty: {
			type: String,
			required: [true, "A tour must have a difficulty"],
			enum: {
				values: ["easy", "medium", "difficult"],
				message: "Difficulty is either: easy, medium, difficult",
			},
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [1, "Rating must be above or equal 1.0"],
			max: [5, "Rating must be below or equal 5.0"],
		},
		ratingsQuantity: { type: Number, default: 0 },
		rating: { type: Number, default: 4.5 },
		price: { type: Number, required: [true, "A tour must have a price"] },
		priceDiscount: {
			type: Number,
			validate: {
				validator: function(this: ITour, value: number) {
					// this will be valued just when creating new document, undefined when update
					return value < this.price;
				},
				message: "Discount price ({VALUE}) should be below regular price",
			},
		},
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
			default: Date.now(),
		},
		startDates: [Date],
		secretTour: {
			type: Boolean,
			default: false,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// not queryable!
tourSchema.virtual("durationWeeks").get(function() {
	return Math.round(this.duration / 7);
});

// Executed before .save() and .create()
tourSchema.pre("save", function(next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

// Query middleware (can be used with regexp as well but errors with typescript)

let start: number = 0;

const findQueryMiddleware: MongooseQueryMiddleware[] = [
	"find",
	"findOne",
	"findOneAndDelete",
	"findOneAndRemove",
	"findOneAndUpdate",
	"findOneAndReplace",
];

tourSchema.pre(findQueryMiddleware, function(next) {
	this.find({ secretTour: { $ne: true } });
	start = performance.now();
	next();
});

tourSchema.post(findQueryMiddleware, function(_, next) {
	this.find({ secretTour: { $ne: true } });
	const elapsed = performance.now() - start;
	console.log(`find took ${elapsed} milliseconds`);
	next();
});

// Aggregation middleware

tourSchema.pre("aggregate", function(next) {
	this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
	next();
});

export const Tour = mongoose.model("tour", tourSchema);
