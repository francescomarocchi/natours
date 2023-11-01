import { UserRoles } from '../../model/user';
import { CONTROLLER_METHOD_ACCESSOR } from '../constants';
import { AuthorizeMetadata } from '../interfaces/authorize-metadata';
import { Constructable } from '../types/constructable';

export const authorize = (roles?: UserRoles[]) => {
  return (target: Constructable, key: string): void => {
    let metadataList: AuthorizeMetadata[] = [];
    if (!Reflect.hasOwnMetadata(CONTROLLER_METHOD_ACCESSOR, target.constructor)) {
      Reflect.defineMetadata(CONTROLLER_METHOD_ACCESSOR, metadataList, target.constructor);
    } else {
      metadataList = Reflect.getOwnMetadata(CONTROLLER_METHOD_ACCESSOR, target.constructor);
    }

    metadataList.push({ key, roles });
  };
};

export const getMethodsAccessor = (ctor: NewableFunction): AuthorizeMetadata[] => {
  // Constructor metadata
  const methodMetadata: AuthorizeMetadata[] =
    (Reflect.getOwnMetadata(CONTROLLER_METHOD_ACCESSOR, ctor) as AuthorizeMetadata[]) ?? [];
  // Prototype metadata
  const genericMetadata: AuthorizeMetadata[] =
    (Reflect.getMetadata(
      CONTROLLER_METHOD_ACCESSOR,
      Reflect.getPrototypeOf(ctor) as NewableFunction
    ) as AuthorizeMetadata[]) ?? [];
  return [...methodMetadata, ...genericMetadata];
};
