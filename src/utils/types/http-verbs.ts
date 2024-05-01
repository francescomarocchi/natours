export type HTTP_VERBS =
  | 'all'
  | 'delete'
  | 'get'
  | 'head'
  | 'options'
  | 'patch'
  | 'post'
  | 'put';

export const getStatusCodeFromHttpVerb = (verb: HTTP_VERBS): number => {
  let statusCode = 200;
  switch (verb) {
    case 'post':
      statusCode = 201;
      break;
    case 'delete':
      statusCode = 204;
      break;
  }
  return statusCode;
};
