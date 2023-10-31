import express, { Express, Handler, NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import jwt from 'jsonwebtoken';
import { Error } from 'mongoose';
import { isObservable, take } from 'rxjs';
import { AppError } from '../model/error';
import { CONTROLLER, IS_DEVELOPMENT } from './constants';
import { getMethodsAccessor } from './decorators/authorize.decorator';
import { getControllerMetadata, getControllers } from './decorators/controller.decorator';
import { getMethodsMetadata } from './decorators/http-method.decorator';
import { getParametersMetadata } from './decorators/parameters.decorator';
import { ControllerMetadata } from './interfaces/controller-metadata';
import { ParameterMetadata } from './interfaces/parameter-metadata';
import { NewableFunctionWithProperties } from './types/newable-function-with-properties';

export class ExpressMetadataApplication {
  private readonly app: Express = this.container.get<Express>('app');
  private readonly isDevelopment: boolean =
    this.container.get<boolean>(IS_DEVELOPMENT);

  private constructor(private readonly container: Container) {
  }

  public parseControllers(): ExpressMetadataApplication {
    // Get controllers from metadata
    const controllers: NewableFunction[] = getControllers();
    // ...and bind them in container
    controllers.forEach((controller) => {
      this.container
        .bind(CONTROLLER)
        .to(controller as new (...args: never[]) => unknown);
    });

    // The way to get controller instances is through container
    const controllersFromContainer: NewableFunctionWithProperties[] =
      this.container.getAll<NewableFunctionWithProperties>(CONTROLLER);

    controllersFromContainer.forEach(
      (controller: NewableFunctionWithProperties) => {
        // Get controller metadata
        const controllerMetadata: ControllerMetadata = getControllerMetadata(
          controller.constructor
        );

        // Get methods metadata
        const methodsMetadata = getMethodsMetadata(controller.constructor);

        // Get methods accessor (authorize)
        const methodsAccessor: string[] = getMethodsAccessor(controller.constructor);

        // Get parameters metadata
        const parametersMetadata = getParametersMetadata(
          controller.constructor
        );

        const router = express.Router();

        methodsMetadata?.forEach((methodMetadata) => {
          const method = controller[methodMetadata.key] as () => unknown;
          if (!method) {
            throw new Error('no handler found!');
          }

          const parameters = parametersMetadata[methodMetadata.key];
          const handler = ExpressMetadataApplication.createHandler(
            method.bind(controller),
            parameters
          );

          /*
           * Never forget, it's always possible to place even more than
           * just one handler for a route (multiple middlewares)
           */

          if (methodsAccessor.includes(methodMetadata.key)) {
            router.route(methodMetadata.path)[methodMetadata.method](
              (request: Request, response: Response, next: NextFunction) => {
                const token = request.headers['authorization']?.startsWith(
                  'Bearer'
                )
                  ? request.headers['authorization'].split(' ')[1]
                  : undefined;

                // 1. Not existing token
                if (!token) {
                  return next(new AppError('Please login to get this route', 401));
                }

                // 2. Verify token
                try {
                  jwt.verify(token, process.env.JWT_SECRET!);
                } catch (error) {
                  const errorName = (error as Error).name;
                  if (errorName === 'JsonWebTokenError') {
                    return next(new AppError('Invalid signature. Please login again', 401));
                  } else if (errorName === 'TokenExpiredError') {
                    return next(new AppError('Token expired, please login again', 401));
                  }
                }

                // 3. Is user still existing?
                // TODO: NOT IMPLEMENTED, SELECT USER AND CHECK IF EXISTING PICKING UP ID FROM TOKEN

                // 4. Did user change password?
                // TODO: call User.changedPasswordAfter(...) to get if password changed after token has ben issued

                next();
              }
            );
          }
          router.route(methodMetadata.path)[methodMetadata.method](handler);
        });

        this.app.use(controllerMetadata.path, router);
      }
    );
    return this;
  }

  /**
   * Handlers added with this chaining method will
   * be used only if production mode is NOT set
   */
  public addDevMiddleware(handler: unknown): ExpressMetadataApplication {
    if (this.isDevelopment) {
      this.app.use(handler as Handler);
    }
    return this;
  }

  public addMiddleware(handler: unknown): ExpressMetadataApplication {
    this.app.use(handler as Handler);
    return this;
  }

  public startListening(): void {
    const port = process.env.PORT || 8080;
    const server = this.app.listen(port, () => {
      console.log(
        `Running in ${
          this.isDevelopment ? 'development' : 'production'
        } mode on port ${port} 🤙`
      );
    });

    const universalHandler = (error: Error) => {
      console.error(error.name, error.message);
      server.close(() => {
        process.exit(1);
      });
    };

    // Gracefully shutdown the application in case of unhandled rejections or exceptions
    process.on('unhandledRejection', universalHandler);
    process.on('uncaughtException', universalHandler);
  }

  public static create(container: Container): ExpressMetadataApplication {
    return new ExpressMetadataApplication(container);
  }

  private static createHandler(
    method: (...args: unknown[]) => unknown,
    parametersMetadata: ParameterMetadata[]
  ): Handler {
    return (request: Request, response: Response, next: NextFunction) => {
      const args: unknown[] = [request, response, next];
      parametersMetadata?.forEach((parameter) => {
        switch (parameter.type) {
          case 'response':
            args[parameter.index] = response;
            break;
          case 'request':
            args[parameter.index] = request;
            break;
          case 'params':
            if (!parameter.parameterName) {
              throw new Error(
                `provide parameter name for parameter at index ${parameter.index}`
              );
            }
            args[parameter.index] = request.params[parameter.parameterName];
            break;
          case 'body':
            args[parameter.index] = request.body;
            break;
          case 'query':
            args[parameter.index] = request.query;
            break;
          case 'next':
            args[parameter.index] = next;
            break;
        }
      });

      const payload = method(...args);

      if (isObservable(payload)) {
        payload.pipe(take(1)).subscribe({
          next: (payload) => {
            response.locals.handlerResponse = payload;
            next();
          },
          error: (error) => {
            response.locals.handlerResponse = error;
            next();
          }
        });
      } else {
        response.locals.handlerResponse = payload;
        next();
      }
    };
  }
}
