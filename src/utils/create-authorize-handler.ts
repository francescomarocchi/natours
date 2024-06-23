import { Handler, NextFunction, Request, Response } from "express";
import { UserRoles } from "../model/user";
import { getToken } from "./get-token";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../model/error";

export const createAuthorizeHandler = (roles?: UserRoles[]): Handler => {
  return (request: Request, _: Response, next: NextFunction) => {
    const token = getToken(request);

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

    // 3. Is user still existing?
    // TODO: NOT IMPLEMENTED, SELECT USER AND CHECK IF EXISTING PICKING UP ID FROM TOKEN

    // 4. Did user change password?
    // TODO: call User.changedPasswordAfter(...) to get if password changed after token has ben issued

    next();
  };
};
