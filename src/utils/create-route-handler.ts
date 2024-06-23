import { Handler, NextFunction, Request, Response } from "express";
import { ParameterMetadata } from "./interfaces/parameter-metadata";
import { isObservable, take } from "rxjs";

const setLocals = (response: Response, params: CreateRouteHandlerParams, data: unknown): void => {
  response.locals.cookieExpiration = params.cookieExpiration;
  response.locals.isDevelopment = params.isDevelopment;
  response.locals.handlerResponse = data;
  response.locals.statusCode = params.statusCode;
}

export interface CreateRouteHandlerParams {
  method: (...args: unknown[]) => unknown;
  parametersMetadata: ParameterMetadata[];
  cookieExpiration: number;
  isDevelopment: boolean;
  statusCode: number;
}

export const createRouteHandler = (params: CreateRouteHandlerParams): Handler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const args: unknown[] = [request, response, next];

    params.parametersMetadata?.forEach((parameter) => {
      switch (parameter.type) {
        case 'response':
          args[parameter.index] = response;
          break;
        case 'request':
          args[parameter.index] = request;
          break;
        case 'next':
          args[parameter.index] = next;
          break;
        case 'params':
          if (!parameter.parameterName) {
            throw new Error(
              `provide parameter name for parameter at index ${parameter.index}`,
            );
          }
          args[parameter.index] = request.params[parameter.parameterName];
          break;
        case 'body':
          args[parameter.index] = request.body;
          break;
        case 'query':
          args[parameter.index] = request.query;
          break;
        case 'user':
          args[parameter.index] = response.locals.user;
          break;
      }
    });

    const payload = params.method(...args);

    if (isObservable(payload)) {
      payload.pipe(take(1)).subscribe({
        next: (data) => {
          setLocals(response, params, data);
          next();
        },
        error: (error) => {
          response.locals.handlerResponse = error;
          next();
        },
      });
    } else {
      setLocals(response, params, payload);
      next();
    }
  };
};

