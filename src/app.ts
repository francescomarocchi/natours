import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import container from './container';
import { errorCatcher } from './middleware/error-catcher';
import { handlerResponseWrapper } from './middleware/handler-response-wrapper';
import { notFoundCatcher } from './middleware/not-found-catcher';
import { expressRateLimit } from './middleware/rate-limiter';
import { CONNECTION_STRING } from './utils/constants';
import { ExpressMetadataApplication } from './utils/express-metadata-application';
import { userRetriever } from './middleware/user';

// TODO: make this become a module!
import './controllers/service-controller';
import './controllers/reviews-controller';
import './controllers/tours-controller';
import './controllers/users-controller';
import './controllers/auth-controller';
import './controllers/views-controller';

ExpressMetadataApplication.create(container)
  .setViewEngine('pug', 'src/views')
  .addStaticFolder('public')
  .addMiddleware(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", 'unpkg.com'],
          'img-src': [
            'tile.openstreetmap.org',
            'tile.thunderforest.com',
            'localhost:8080',
          ],
        },
      },
    })
  )
  .addDevMiddleware(morgan('dev'))
  .addApiMiddleware(expressRateLimit())
  .addMiddleware(fileUpload())
  .addMiddleware(express.json({ limit: '10kb' }))
  .addMiddleware(express.urlencoded({ extended: true, limit: '10kb' }))
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
    })
  )
  .addMiddleware(userRetriever())
  .parseControllers()
  .addMiddleware(handlerResponseWrapper())
  .addMiddleware(notFoundCatcher())
  .addMiddleware(errorCatcher())
  .startListening();

mongoose.connect(container.get(CONNECTION_STRING));
