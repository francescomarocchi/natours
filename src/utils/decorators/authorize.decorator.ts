import { CONTROLLER_METHOD_ACCESSOR } from '../constants';
import { Constructable } from '../types/constructable';

export const authorize = () => {
  return (target: Constructable, key: string): void => {
    let metadataList: string[] = [];
    if (!Reflect.hasOwnMetadata(CONTROLLER_METHOD_ACCESSOR, target.constructor)) {
      Reflect.defineMetadata(CONTROLLER_METHOD_ACCESSOR, metadataList, target.constructor);
    } else {
      metadataList = Reflect.getOwnMetadata(CONTROLLER_METHOD_ACCESSOR, target.constructor);
    }

    metadataList.push(key);
  };
};

export const getMethodsAccessor = (ctor: NewableFunction): string[] => {
  // Constructor metadata
  const methodMetadata: string[] = (Reflect.getOwnMetadata(CONTROLLER_METHOD_ACCESSOR, ctor) as string[]) ?? [];
  // Prototype metadata
  const genericMetadata: string[] =
    (Reflect.getMetadata(CONTROLLER_METHOD_ACCESSOR, Reflect.getPrototypeOf(ctor) as NewableFunction) as string[]) ??
    [];
  return [...methodMetadata, ...genericMetadata];
};
