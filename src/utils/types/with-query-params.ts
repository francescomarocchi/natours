export interface QueryParams {
  sort?: string;
  fields?: string;
  page?: string;
  limit?: string;
}

export type WithQueryParams<T> = T & QueryParams;
