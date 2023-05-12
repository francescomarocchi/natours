import { NextFunction, Request, Response } from "express";
import { createAppResponse } from "../utils/create-app-response";

export const errorCatcher =
	() => (error: Error, _: Request, response: Response, next: NextFunction) => {
		response
			.status(500)
			.json(createAppResponse(undefined, "error", error.message));
		next();
	};
