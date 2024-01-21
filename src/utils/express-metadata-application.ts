import express, {
  Express,
  Handler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { Container } from 'inversify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { isObservable, take } from 'rxjs';
import { AppError } from '../model/error';
import { UserRoles } from '../model/user';
import { CONTROLLER, IS_DEVELOPMENT } from './constants';
import { getMethodsAccessor } from './decorators/authorize.decorator';
import {
  getControllerMetadata,
  getControllers,
} from './decorators/controller.decorator';
import { getMethodsMetadata } from './decorators/http-method.decorator';
import { getParametersMetadata } from './decorators/parameters.decorator';
import { AuthorizeMetadata } from './interfaces/authorize-metadata';
import { ControllerMetadata } from './interfaces/controller-metadata';
import { ParameterMetadata } from './interfaces/parameter-metadata';
import { NewableFunctionWithProperties } from './types/newable-function-with-properties';
import { ExtendedRequest } from '../model/request';

export class ExpressMetadataApplication {
  private readonly app: Express = this.container.get<Express>('app');
  private readonly isDevelopment: boolean =
    this.container.get<boolean>(IS_DEVELOPMENT);

  // We can get instance of user service here to be used for checks in TODOS in this file

  private constructor(private readonly container: Container) { }

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
          controller.constructor,
        );

        // Get methods metadata
        const methodsMetadata = getMethodsMetadata(controller.constructor);

        // Get methods authorization metadata
        const methodsAccessor: AuthorizeMetadata[] = getMethodsAccessor(
          controller.constructor,
        );

        // Get parameters metadata
        const parametersMetadata = getParametersMetadata(
          controller.constructor,
        );

        const router = express.Router();

        methodsMetadata?.forEach((methodMetadata) => {
          const method = controller[methodMetadata.key] as () => unknown;
          if (!method) {
            throw new Error('no handler found!');
          }

          const parameters = parametersMetadata[methodMetadata.key];
          const routeHandler = ExpressMetadataApplication.createRouteHandler(
            method.bind(controller),
            parameters,
          );

          /*
           * Just if route has been marked as protected we add an extra handler
           * to check if the user has every needed permission granted
           */

          const accessor = methodsAccessor.find(
            (accessor) => accessor.key === methodMetadata.key,
          );
          if (accessor) {
            const authorizeHandler =
              ExpressMetadataApplication.createAuthorizeHandler(accessor.roles);
            router
              .route(methodMetadata.path)
            [methodMetadata.method](authorizeHandler);
          }

          router
            .route(methodMetadata.path)
          [methodMetadata.method](routeHandler);
        });

        this.app.use(controllerMetadata.path, router);
      },
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
        `Running in ${this.isDevelopment ? 'development' : 'production'
        } mode on port ${port} 🤙`,
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

  private static createRouteHandler(
    method: (...args: unknown[]) => unknown,
    parametersMetadata: ParameterMetadata[],
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
                `provide parameter name for parameter at index ${parameter.index}`,
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
          },
        });
      } else {
        response.locals.handlerResponse = payload;
        next();
      }
    };
  }

  private static createAuthorizeHandler(roles?: UserRoles[]): Handler {
    return (request: Request, response: Response, next: NextFunction) => {
      const token = request.headers['authorization']?.startsWith('Bearer')
        ? request.headers['authorization'].split(' ')[1]
        : undefined;

      // 1. Not existing token
      if (!token) {
        return next(new AppError('Please login to get this route', 401));
      }

      const decodedToken = jwt.decode(token) as JwtPayload;
      const role = decodedToken.role;
      if (roles && roles.length > 0 && !roles.includes(role)) {
        return next(
          new AppError(
            `${role} role cannot access this content. Required: ${roles.join(
              ', ',
            )}`,
            403,
          ),
        );
      }

      // 2. Verify token
      try {
        jwt.verify(token, process.env.JWT_SECRET ?? '');
      } catch (error) {
        const errorName = (error as Error).name;
        if (errorName === 'JsonWebTokenError') {
          return next(
            new AppError('Invalid signature. Please login again', 401),
          );
        } else if (errorName === 'TokenExpiredError') {
          return next(new AppError('Token expired, please login again', 401));
        }
      }

      // Since we're here we can export user data to request for future usage
      (request as ExtendedRequest).locals = {
        id: decodedToken['id'],
        role: role,
      };

      // 3. Is user still existing?
      // TODO: NOT IMPLEMENTED, SELECT USER AND CHECK IF EXISTING PICKING UP ID FROM TOKEN

      // 4. Did user change password?
      // TODO: call User.changedPasswordAfter(...) to get if password changed after token has ben issued

      next();
    };
  }
}
