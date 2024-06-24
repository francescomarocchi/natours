import { AppResponse } from "./interfaces/app-response";

export const createAppResponse = <T>(
  data: T,
  status: 'success' | 'error' | 'notfound',
  message?: string,
): AppResponse<T> => {
  const isEmpty = data === 'empty';
  return {
    data: isEmpty ? undefined : data,
    status,
    message,
  };
};
