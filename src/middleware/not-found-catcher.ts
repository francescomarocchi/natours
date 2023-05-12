import { NextFunction, Request, Response } from 'express';
import { createAppResponse } from '../utils/create-app-response';

export function notFoundCatcher() {
  return (request: Request, response: Response, next: NextFunction) => {
    response
      .status(404)
      .json(createAppResponse(undefined, 'notfound', `Could not find resource ${request.url}`));
    next();
  };
}
