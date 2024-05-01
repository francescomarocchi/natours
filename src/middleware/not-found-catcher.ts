import { NextFunction, Request, Response } from 'express';
import { createAppResponse } from '../utils/create-app-response';

export function notFoundCatcher() {
  return (request: Request, response: Response, next: NextFunction) => {
    const notFoundResponse = response.status(404);
    if (request.url.indexOf('api/v1') !== -1)
      notFoundResponse.json(
        createAppResponse(
          undefined,
          'notfound',
          `Could not find resource ${request.url}`,
        ),
      );
    else notFoundResponse.render('not-found');
    next();
  };
}
