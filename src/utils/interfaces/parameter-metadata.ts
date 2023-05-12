import { PARAMETER } from '../types/parameter';

export interface ParameterMetadata {
  index: number;
  injectRoot: boolean;
  parameterName?: string | undefined;
  type: PARAMETER;
}
