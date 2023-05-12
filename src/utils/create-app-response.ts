import { AppResponse } from '../routes/interfaces/app-response';

export const createAppResponse = <T>(
  data: T,
  status: 'success' | 'error' | 'notfound',
  message?: string
): AppResponse<T> => ({
  data,
  status,
  message,
});
