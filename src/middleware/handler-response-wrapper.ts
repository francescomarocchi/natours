import { createAppResponse } from '../utils/create-app-response';
import { Handler, NextFunction, Request, Response } from 'express';

export function handlerResponseWrapper(): Handler {
  return (request: Request, response: Response, next: NextFunction) => {
    const handlerResponse = response.locals.handlerResponse;

    if (
      // Why did I do it like this?????
      // !handlerResponse ||
      // (Array.isArray(handlerResponse) && handlerResponse.length === 0)
      false
    ) {
      next();
    } else if (handlerResponse instanceof Error) {
      throw handlerResponse;
    } else {
      let statusCode = 200;
      switch (request.method) {
        case 'POST':
          statusCode = 201;
          break;
        case 'DELETE':
          statusCode = 204;
          break;
      }

      // TODO: this sucks, find a better way
      if (response.locals.statusCode) {
        statusCode = response.locals.statusCode;
      }

      response
        .status(statusCode)
        .json(createAppResponse(handlerResponse, 'success'));
    }
  };
}
