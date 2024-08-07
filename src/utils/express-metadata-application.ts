import express, { Express, Handler, Router } from 'express';
import { Container } from 'inversify';
import { CONTROLLER, IS_DEVELOPMENT, JWT_COOKIE_EXPIRES_IN } from './constants';
import { getMethodsAccessor } from './decorators/authorize.decorator';
import {
  getControllerMetadata,
  getControllers,
} from './decorators/controller.decorator';
import { getMethodsMetadata } from './decorators/http-method.decorator';
import { getParametersMetadata } from './decorators/parameters.decorator';
import { AuthorizeMetadata } from './interfaces/authorize-metadata';
import { ControllerMetadata } from './interfaces/controller-metadata';
import { NewableFunctionWithProperties } from './types/newable-function-with-properties';
import { getStatusCodeFromHttpVerb } from './types/http-verbs';
import { createRouteHandler } from './create-route-handler';
import { createAuthorizeHandler } from './create-authorize-handler';

export class ExpressMetadataApplication {
  private readonly app: Express = this.container.get<Express>('app');
  private readonly isDevelopment: boolean =
    this.container.get<boolean>(IS_DEVELOPMENT);
  private readonly routers = new Map<string, Router>([]);

  // We can get instance of user service here to be used for checks in TODOS in this file

  private constructor(private readonly container: Container) { }

  public static create(container: Container): ExpressMetadataApplication {
    return new ExpressMetadataApplication(container);
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

    // Early router creation as they need
    // to be used in conjunction for routing merge
    controllersFromContainer.forEach(
      (controller: NewableFunctionWithProperties) => {
        // Get controller metadata
        const controllerMetadata: ControllerMetadata = getControllerMetadata(
          controller.constructor,
        );

        this.routers.set(
          controllerMetadata.path,
          express.Router(controllerMetadata.options),
        );
      },
    );

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

        const localRouter = this.routers.get(controllerMetadata.path);

        if (!localRouter) {
          throw new Error(
            'Something really bad happened with routers configuration!',
          );
        }

        if (controller.bindRouter) {
          // TODO: Now just a single entry, this must be an array!
          const routeBinding = controller.bindRouter();
          const targetRouter = this.routers.get(routeBinding.target);

          if (!targetRouter) {
            throw new Error(
              'No target route found. Please check if path is correct!',
            );
          }

          localRouter.use(routeBinding.local, targetRouter);
        }

        methodsMetadata?.forEach((methodMetadata) => {
          const method = controller[methodMetadata.key] as () => unknown;
          if (!method) {
            throw new Error('no handler found!');
          }

          const parameters = parametersMetadata[methodMetadata.key];
          const routeHandler = createRouteHandler({
            method: method.bind(controller),
            parametersMetadata: parameters,
            isDevelopment: this.isDevelopment,
            statusCode: methodMetadata.statusCode ??
              getStatusCodeFromHttpVerb(methodMetadata.method),
          });

          /*
           * Just if route has been marked as protected we add an extra handler
           * to check if the user has every needed permission granted
           */

          const accessor = methodsAccessor.find(
            (accessor) => accessor.key === methodMetadata.key,
          );
          if (accessor) {
            const authorizeHandler = createAuthorizeHandler(accessor.roles);
            localRouter
              .route(methodMetadata.path)
            [methodMetadata.method](authorizeHandler);
          }

          localRouter
            .route(methodMetadata.path)
          [methodMetadata.method](routeHandler);
        });

        this.app.use(controllerMetadata.path, localRouter);
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

  public addApiMiddleware(handler: unknown): ExpressMetadataApplication {
    this.app.use('/api', handler as Handler);
    return this;
  }

  public addStaticFolder(folder: string): ExpressMetadataApplication {
    this.app.use(express.static(folder));
    return this;
  }

  public setViewEngine(
    engine: string,
    viewsFolder: string,
  ): ExpressMetadataApplication {
    this.app.set('views', viewsFolder);
    this.app.set('view engine', engine);
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
}
