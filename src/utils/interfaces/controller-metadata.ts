import { RouterOptions } from 'express';

export interface ControllerMetadata {
  path: string;
  options?: RouterOptions;
  target: NewableFunction;
}
