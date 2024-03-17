import { CONTROLLER_METHOD_PARAMETER } from '../constants';
import { ParameterMetadata } from '../interfaces/parameter-metadata';
import { PARAMETER } from '../types/parameter';
import { ParametersMetadata } from '../interfaces/parameters-metadata';

export const params = (type: PARAMETER, parameterName?: string) => {
  return (
    target: { constructor: NewableFunction },
    methodName: string | symbol,
    index: number,
  ): void => {
    let metadataList: ParametersMetadata = {};
    let parameterMetadataList: ParameterMetadata[] = [];
    const parameterMetadata: ParameterMetadata = {
      index,
      parameterName,
      type,
    };
    if (
      !Reflect.hasOwnMetadata(CONTROLLER_METHOD_PARAMETER, target.constructor)
    ) {
      parameterMetadataList.unshift(parameterMetadata);
    } else {
      metadataList = Reflect.getOwnMetadata(
        CONTROLLER_METHOD_PARAMETER,
        target.constructor,
      ) as ParametersMetadata;
      if (metadataList[methodName as string]) {
        parameterMetadataList = metadataList[methodName as string] || [];
      }
      parameterMetadataList.unshift(parameterMetadata);
    }
    metadataList[methodName as string] = parameterMetadataList;
    Reflect.defineMetadata(
      CONTROLLER_METHOD_PARAMETER,
      metadataList,
      target.constructor,
    );
  };
};

export const getParametersMetadata = (
  ctor: NewableFunction,
): ParametersMetadata => {
  // Constructor metadata
  const methodMetadata: ParametersMetadata = Reflect.getOwnMetadata(
    CONTROLLER_METHOD_PARAMETER,
    ctor,
  ) as ParametersMetadata;
  // Prototype metadata
  const genericMetadata: ParametersMetadata = Reflect.getMetadata(
    CONTROLLER_METHOD_PARAMETER,
    Reflect.getPrototypeOf(ctor) as NewableFunction,
  ) as ParametersMetadata;
  return { ...methodMetadata, ...genericMetadata };
};
