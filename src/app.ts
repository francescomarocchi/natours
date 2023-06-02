import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import container from './container';
import { errorCatcher } from './middleware/error-catcher';
import { handlerResponseWrapper } from './middleware/handler-response-wrapper';
import { notFoundCatcher } from './middleware/not-found-catcher';
import { CONNECTION_STRING } from './utils/constants';
import { ExpressMetadataApplication } from './utils/express-metadata-application';

// TODO: make this become a module!
import './routes/controllers/tours-route-controller';
import './routes/controllers/users-controller';

ExpressMetadataApplication.create(container)
  .addDevMiddleware(morgan('dev'))
  .addMiddleware(express.json())
  .parseControllers()
  .addMiddleware(handlerResponseWrapper())
  .addMiddleware(notFoundCatcher())
  .addMiddleware(errorCatcher())
  .startListening();

mongoose.connect(container.get(CONNECTION_STRING));
