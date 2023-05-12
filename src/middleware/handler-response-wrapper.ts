import { createAppResponse } from "../utils/create-app-response";
import { Handler, NextFunction, Request, Response } from "express";

export function handlerResponseWrapper(): Handler {
	return (_: Request, response: Response, next: NextFunction) => {
		const handlerResponse = response.locals.handlerResponse;

		if (!handlerResponse) {
			next();
		} else if (handlerResponse instanceof Error) {
			response
				.status(500)
				.json(createAppResponse(undefined, "error", handlerResponse.message));
		} else {
			response.status(200).json(createAppResponse(handlerResponse, "success"));
		}
	};
}
