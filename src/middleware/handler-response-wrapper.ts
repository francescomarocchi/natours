import { PugTemplate } from '../model/pug-template';
import { createAppResponse } from '../utils/create-app-response';
import {
  CookieOptions,
  Handler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { ForCookie } from '../utils/types/for-cookie';

export function handlerResponseWrapper(): Handler {
  return (request: Request, response: Response, next: NextFunction) => {
    // No handler found if locals haven't been populated
    if (Object.keys(response.locals).length === 0) {
      response.locals.notFound = true;
      next();
      return;
    }

    const { handlerResponse, cookieExpiration, isDevelopment, statusCode } =
      response.locals;

    if (handlerResponse instanceof Error) {
      throw handlerResponse;
    }

    if (handlerResponse instanceof PugTemplate) {
      response
        .status(statusCode)
        .render(handlerResponse.template, handlerResponse.data as object);
      return;
    }

    if (handlerResponse instanceof ForCookie) {
      const cookieOptions: CookieOptions = {
        expires: new Date(Date.now() + cookieExpiration),
        httpOnly: true,
      };

      cookieOptions.secure = !isDevelopment;

      response.cookie('jwt', handlerResponse.token, cookieOptions);
      response
        .status(statusCode)
        .json(createAppResponse(handlerResponse.payload, 'success'));
      return;
    }

    response
      .status(statusCode)
      .json(createAppResponse(handlerResponse, 'success'));
  };
}
