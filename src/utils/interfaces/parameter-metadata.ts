import { PARAMETER } from '../types/parameter';

export interface ParameterMetadata {
  index: number;
  parameterName?: string | undefined;
  type: PARAMETER;
}
