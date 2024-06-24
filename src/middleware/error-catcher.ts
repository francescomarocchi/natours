import { NextFunction, Request, Response } from "express";
import { createAppResponse } from "../utils/create-app-response";
import { AppError } from "../model/error";

export const errorCatcher =
  () =>
    (
      error: Error | AppError,
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      console.error(error);


      const isToApi = ['/api', '/signup', '/login', '/logout', '/forgot-password', '/reset-password', '/change-password'].some(url => request.originalUrl.startsWith(url))

      if (!isToApi) {
        response
          .status(error instanceof AppError ? error.statusCode : 500)
          .render('error', {
            title: 'Something went wrong',
            message: error.message,
          })
        return;
      }

      response
        .status(error instanceof AppError ? error.statusCode : 500)
        .json(createAppResponse(undefined, "error", error.message));
      next();
    };
