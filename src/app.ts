import express from 'express';
import morgan from 'morgan';
import container from './container';
import { errorCatcher } from './middleware/error-catcher';
import { handlerResponseWrapper } from './middleware/handler-response-wrapper';
import { notFoundCatcher } from './middleware/not-found-catcher';
import { ExpressMetadataApplication } from './utils/express-metadata-application';

// TODO: make this become a module!
import './routes/handlers/tours-route-handler';
import './routes/handlers/users-handler';

ExpressMetadataApplication.create(container)
  .developmentOnly(morgan('dev'))
  .use(express.json())
  .use(handlerResponseWrapper())
  .use(notFoundCatcher())
  .use(errorCatcher())
  .startListening();
