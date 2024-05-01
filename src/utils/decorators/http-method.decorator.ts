import { CONTROLLER_METHOD } from '../constants';
import { MethodMetadata } from '../interfaces/method-metadata';

import { Constructable } from '../types/constructable';
import { HTTP_VERBS } from '../types/http-verbs';

export const httpMethod = (
  method: HTTP_VERBS,
  path: string,
  statusCode?: number,
) => {
  return (target: Constructable, key: string): void => {
    const metadata: MethodMetadata = {
      key,
      method,
      path,
      target,
      statusCode,
    };

    /**
     * uses target's constructor to store all metadata as an array
     */

    let metadataList: MethodMetadata[] = [];
    if (!Reflect.hasOwnMetadata(CONTROLLER_METHOD, target.constructor)) {
      Reflect.defineMetadata(
        CONTROLLER_METHOD,
        metadataList,
        target.constructor,
      );
    } else {
      metadataList = Reflect.getOwnMetadata(
        CONTROLLER_METHOD,
        target.constructor,
      );
    }

    metadataList.push(metadata);
  };
};

export const getMethodsMetadata = (ctor: NewableFunction): MethodMetadata[] => {
  // Constructor metadata
  const methodMetadata: MethodMetadata[] =
    (Reflect.getOwnMetadata(CONTROLLER_METHOD, ctor) as MethodMetadata[]) ?? [];
  // Prototype metadata
  const genericMetadata: MethodMetadata[] =
    (Reflect.getMetadata(
      CONTROLLER_METHOD,
      Reflect.getPrototypeOf(ctor) as NewableFunction,
    ) as MethodMetadata[]) ?? [];
  return [...methodMetadata, ...genericMetadata];
};
