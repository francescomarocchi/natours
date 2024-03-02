import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import container from './container';
import { errorCatcher } from './middleware/error-catcher';
import { handlerResponseWrapper } from './middleware/handler-response-wrapper';
import { notFoundCatcher } from './middleware/not-found-catcher';
import { expressRateLimit } from './middleware/rate-limiter';
import { CONNECTION_STRING } from './utils/constants';
import { ExpressMetadataApplication } from './utils/express-metadata-application';

// TODO: make this become a module!
import './routes/controllers/service-controller';
import './routes/controllers/tours-controller';
import './routes/controllers/users-controller';
import './routes/controllers/auth-controller';

ExpressMetadataApplication.create(container)
  .addMiddleware(helmet())
  .addDevMiddleware(morgan('dev'))
  .addApiMiddleware(expressRateLimit())
  .addMiddleware(express.json({ limit: '10kb' }))
  .addMiddleware(mongoSanitize())
  // find and add a good xss sanitizer!
  .addMiddleware(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
      ],
    }),
  )
  .parseControllers()
  .addMiddleware(handlerResponseWrapper())
  .addMiddleware(notFoundCatcher())
  .addMiddleware(errorCatcher())
  .startListening();

mongoose.connect(container.get(CONNECTION_STRING));
