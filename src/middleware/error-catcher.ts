import { NextFunction, Request, Response } from "express";
import { createAppResponse } from "../utils/create-app-response";
import { AppError } from "../model/error";

export const errorCatcher =
	() =>
		(
			error: Error | AppError,
			_: Request,
			response: Response,
			next: NextFunction,
		) => {
			console.error(error);
			response
				.status(error instanceof AppError ? error.statusCode : 500)
				.json(createAppResponse(undefined, "error", error.message));
			next();
		};
