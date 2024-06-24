import { NextFunction, Request, Response } from "express";
import { User } from "../model/user";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { getToken } from "../utils/get-token";

export const userRetriever = () => async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  const token = getToken(request);
  if (!token) {
    return next();
  }

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret) as JwtPayload;
  const currentUser = await User.findById(decodedToken.id);

  if (!currentUser) return next();
  if (currentUser.changedPasswordAfter(new Date(decodedToken.iat!))) return next();

  response.locals.user = currentUser;
  next();
}
