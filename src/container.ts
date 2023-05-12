import dotenv from 'dotenv';
import express, { Express } from 'express';
import { Container } from 'inversify';
import 'reflect-metadata'; // Used by inversify, MANDATORY
import { ToursService } from './services/tours.service';
import { DATA_FOLDER_PATH, IS_DEVELOPMENT } from './utils/constants';

// path is intended as NODE path (where node is launched)
dotenv.config({ path: 'config.env' });

const container: Container = new Container({ defaultScope: 'Singleton' });

container.bind<string>(DATA_FOLDER_PATH).toConstantValue(`${__dirname}/../dev-data/data`);
container.bind<boolean>(IS_DEVELOPMENT).toConstantValue(process.env.ENVIRONMENT === 'development');
container.bind<Express>('app').toFactory(() => express());
container.bind<ToursService>(ToursService).to(ToursService);

export default container;
