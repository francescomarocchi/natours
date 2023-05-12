import { ParameterMetadata } from './parameter-metadata'

export interface ParametersMetadata {
  [methodName: string]: Array<ParameterMetadata>;
}
