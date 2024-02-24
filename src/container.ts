import dotenv from 'dotenv';
import express, { Express } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata'; // Used by inversify, MANDATORY
import { ToursService } from './services/tours.service';
import {
  CONNECTION_STRING,
  DATA_FOLDER_PATH,
  IS_DEVELOPMENT,
  JWT_COOKIE_EXPIRES_IN,
} from './utils/constants';
import { UserService } from './services/users.service';

// path is intended as NODE path (where node is launched)
dotenv.config({ path: 'config.env' });

const container: Container = new Container({ defaultScope: 'Singleton' });

container
  .bind<string>(DATA_FOLDER_PATH)
  .toConstantValue(`${__dirname}/../dev-data/data`);
container
  .bind<string>(CONNECTION_STRING)
  .toConstantValue(process.env.DATABASE_CONNECTION_STRING ?? '');
container
  .bind<boolean>(IS_DEVELOPMENT)
  .toConstantValue(process.env.ENVIRONMENT === 'development');
container
  .bind<number>(JWT_COOKIE_EXPIRES_IN)
  .toConstantValue(
    (process.env.JWT_COOKIE_EXPIRES_IN
      ? Number(process.env.JWT_COOKIE_EXPIRES_IN)
      : 30) *
    24 *
    60 *
    60 *
    1_000,
  );

// TODO: every configuration value can be set here in container

container.bind<Express>('app').toFactory(() => express());
container.bind<ToursService>(ToursService).to(ToursService);
container.bind<UserService>(UserService).to(UserService);

export default container;
