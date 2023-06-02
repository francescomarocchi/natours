import { createAppResponse } from '../utils/create-app-response';
import { Handler, NextFunction, Request, Response } from 'express';

export function handlerResponseWrapper(): Handler {
  return (request: Request, response: Response, next: NextFunction) => {
    const handlerResponse = response.locals.handlerResponse;

    if (!handlerResponse || (Array.isArray(handlerResponse) && handlerResponse.length === 0)) {
      next();
    } else if (handlerResponse instanceof Error) {
      response.status(500).json(createAppResponse(undefined, 'error', handlerResponse.message));
    } else {
      let statusCode = 200;
      switch (request.method) {
        case 'POST':
          statusCode = 201;
          break;
      }

      response.status(statusCode).json(createAppResponse(handlerResponse, 'success'));
    }
  };
}
