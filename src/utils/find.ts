import { FilterQuery, Model } from 'mongoose';
import { WithQueryParams } from './types/with-query-params';

/**
 * Since the user can introduce as many query string
 * parameters as he/she wants we have to filter out
 * any possible invalid filter that will result in
 * having an empty response
 *
 * @param model The model this filter has to attend
 * @returns the filter without any extra parameter and query params
 */
export const find = <T>(
  model: Model<T>,
  filter: WithQueryParams<T>,
  defaultOrder: string = '-createdAt'
) => {
  const safeFilter = Object.entries(filter as {}).reduce(
    (accumulator, [currentName, currentValue]) => {
      if (Object.keys(model.schema.obj).includes(currentName)) {
        accumulator = { ...accumulator, [currentName]: currentValue };
      }
      return accumulator;
    },
    {} as FilterQuery<T>
  );

  const { sort, fields, page, limit } = filter;

  const pagination = page && limit ? { skip: (+page - 1) * +limit, limit: +limit } : undefined;

  return model.find(safeFilter, fields ?? '-__v', {
    ...pagination,
    sort: sort ?? defaultOrder,
  });
};
