# Route Handler

## What is a handler?

A handler is a class used to handler an express route.

It gets registered in express leveraging reflect-metadata library and lets the user
define methods to handle different http verbs and their parameters as well.

### Basic example
Here a very basic example, defining a controller class that will reply on
url `api/v1/sample` for incoming `GET` requests.

```typescript
@controller('/api/v1/sample')
export class SampleRouteHandler {
  @httpMethod('get', '/')
  private getUsers(): user[] | undefined {
    if (someCondition) {
      throw new AppError('x'); // 500 INTERNAL SERVER ERROR (x)
    } else if (otherCondition) {
      return undefined; // 404 NOT FOUND 
    }
    return [user1, user2, user3, ...];
  }
}
```

a method returing `undefined` will result into a `404 NOT FOUND`, while a `throw new Error('x')` will
produce a `500 INTERNAL SERVER ERROR` and also return the 'x' message.


### Accessing express `request`, `response`, `next` the simple way
If needed request, response and next typical express objects are directly available
if the handler is built like in the example below.
Here we take the id parameter from the query string, gets some data and write it
to the response stream. Pay attention to respect the order:
- `request`
- `response`
- `next`

```typescript
@controller('/api/v1/sample')
export class SampleRouteHandler {
  @httpMethod('get', '/')
  private getUsers(request: Request, response: Response, next: NextFunction): unknown {
    const id = request.query.id;
    const something = getSomethingById(id);
    response.write(something);
    next();
  }
}
```

### Binding specific parameters using decorators
In case we just need for example the `response` object and an 'id' `param` it's
possible to write a specific function. When binding parameters using decorators
order doesn't matter anymore, it's up to developer needs or personal taste.

```typescript
@controller('/api/v1/sample')
export class SampleRouteHandler {
  @httpMethod('get', '/')
  private getUsers(
    @params('param', 'id') id: string,
    @params('next') next: NextFunction,
    @params('response') response: Response
  ): void {
    const someJson = getSomethingById(id);
    if (someJson !== undefined) {
      response.status(200).json(someJson);
    } else {
      // if no json just call next middleware down the stream
      next();
    }
  }
}
```

### Last step: using RxJS Observables
It's possible to return asynchronous responses such as `RxJS Observables` 
(no Promises support at the moment, probably will come soon). The application
will subscribe to it and then behave like in the example above with a `404 NOT FOUND`
in case subscription will return undefined and `500 INTERNAL SERVER ERROR` in case
the stream will throw an Error.

```typescript
@controller('/api/v1/sample')
export class SampleRouteHandler {
  @httpMethod('get', '/')
  private getUsers(
    @params('param', 'id') id: string,
    @params('next') next: NextFunction
  ): Observable<number> {
    if (someCase) {
      return of(undefined); // 404 NOT FOUND
    } else if (bored) {
      // 500 INTERNAL SERVER ERROR ('x')
      return defer(() => throw new AppError('x'));
    }
    return of(1);
  }
}
```
