import { Request } from 'express';

export const getToken = (request: Request): string | undefined => {
  const token = request.headers['authorization']?.startsWith('Bearer')
    ? request.headers['authorization'].split(' ')[1]
    : request.headers['cookie']?.split('=')[1];
  return token;
}

