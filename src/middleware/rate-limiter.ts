import { Handler } from 'express';
import rateLimit from 'express-rate-limit';

export const expressRateLimit = (): Handler => {
  return rateLimit({
    max: 1_000,
    windowMs: 60 * 60 * 1_000,
    message: 'Too many requests. Please try again in one hour!',
  });
};
