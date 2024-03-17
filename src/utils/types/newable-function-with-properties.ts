import { Router } from 'express';

export interface RouterBinding {
  local: string;
  target: string;
}

export type NewableFunctionWithProperties = NewableFunction & {
  [K: string]: unknown;
  bindRouter?: () => RouterBinding;
};
