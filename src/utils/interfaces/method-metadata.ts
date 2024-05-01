import { Constructable } from '../types/constructable';
import { HTTP_VERBS } from '../types/http-verbs';

export interface MethodMetadata {
  key: string;
  method: HTTP_VERBS;
  path: string;
  target: Constructable;
  statusCode?: number;
}
