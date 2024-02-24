import jwt, { JwtPayload } from 'jsonwebtoken';
import {
  CookieOptions,
  Handler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { ParameterMetadata } from './interfaces/parameter-metadata';
import { isObservable, take } from 'rxjs';
import { UserRoles } from '../model/user';
import { AppError } from '../model/error';
import { ExtendedRequest } from '../model/request';
import { ForCookie, isForCookie } from './types/for-cookie';

export const createRouteHandler = (
  method: (...args: unknown[]) => unknown,
  parametersMetadata: ParameterMetadata[],
  cookieExpiration: number,
  isDevelopment: boolean,
): Handler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const args: unknown[] = [request, response, next];
    parametersMetadata?.forEach((parameter) => {
      switch (parameter.type) {
        case 'response':
          args[parameter.index] = response;
          break;
        case 'request':
          args[parameter.index] = request;
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
        case 'next':
          args[parameter.index] = next;
          break;
      }
    });

    const payload = method(...args);

    if (isObservable(payload)) {
      payload.pipe(take(1)).subscribe({
        next: (data) => {
          const actualData = addPayloadToCookieResponseIfNecessary(
            data,
            'jwt',
            response,
            cookieExpiration,
            isDevelopment,
          );
          response.locals.handlerResponse = actualData;
          next();
        },
        error: (error) => {
          response.locals.handlerResponse = error;
          next();
        },
      });
    } else {
      const actualPayload = addPayloadToCookieResponseIfNecessary(
        payload,
        'jwt',
        response,
        cookieExpiration,
        isDevelopment,
      );
      response.locals.handlerResponse = actualPayload;
      next();
    }
  };
};

export const createAuthorizeHandler = (roles?: UserRoles[]): Handler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const token = request.headers['authorization']?.startsWith('Bearer')
      ? request.headers['authorization'].split(' ')[1]
      : undefined;

    // 1. Not existing token
    if (!token) {
      return next(new AppError('Please login to get this route', 401));
    }

    const decodedToken = jwt.decode(token) as JwtPayload;
    const role = decodedToken.role;
    if (roles && roles.length > 0 && !roles.includes(role)) {
      return next(
        new AppError(
          `${role} role cannot access this content. Required: ${roles.join(
            ', ',
          )}`,
          403,
        ),
      );
    }

    // 2. Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET ?? '');
    } catch (error) {
      const errorName = (error as Error).name;
      if (errorName === 'JsonWebTokenError') {
        return next(new AppError('Invalid signature. Please login again', 401));
      } else if (errorName === 'TokenExpiredError') {
        return next(new AppError('Token expired, please login again', 401));
      }
    }

    // Since we're here we can export user data to request for future usage
    (request as ExtendedRequest).locals = {
      id: decodedToken['id'],
      role: role,
    };

    // 3. Is user still existing?
    // TODO: NOT IMPLEMENTED, SELECT USER AND CHECK IF EXISTING PICKING UP ID FROM TOKEN

    // 4. Did user change password?
    // TODO: call User.changedPasswordAfter(...) to get if password changed after token has ben issued

    next();
  };
};

/**
 * Checks if payload is of type ForCookie and
 * in case adds its content to response cookie.
 * In any case returns the correct payload
 */
const addPayloadToCookieResponseIfNecessary = (
  payload: unknown,
  cookieName: string,
  response: Response,
  jwtCookieExpiresIn: number,
  isDevelopment: boolean,
): unknown => {
  if (!isForCookie(payload)) {
    return payload;
  }

  const forCookie = payload as ForCookie<unknown>;
  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + jwtCookieExpiresIn),
    httpOnly: true,
  };

  if (!isDevelopment) {
    cookieOptions.secure = true;
  }

  response.cookie(cookieName, forCookie.token, cookieOptions);
  return forCookie.payload;
};
