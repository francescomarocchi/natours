import express, {
	Express,
	Handler,
	NextFunction,
	Request,
	Response,
} from "express";
import { Container } from "inversify";
import { CONTROLLER, IS_DEVELOPMENT } from "./constants";
import {
	getControllerMetadata,
	getControllers,
} from "./decorators/controller.decorator";
import { getMethodsMetadata } from "./decorators/http-method.decorator";
import { getParametersMetadata } from "./decorators/parameters.decorator";
import { ControllerMetadata } from "./interfaces/controller-metadata";
import { ParameterMetadata } from "./interfaces/parameter-metadata";
import { NewableFunctionWithProperties } from "./types/newable-function-with-properties";
import { isObservable, take } from "rxjs";

export class ExpressMetadataApplication {
	private readonly app: Express = this.container.get<Express>("app");
	private readonly isDevelopment: boolean =
		this.container.get<boolean>(IS_DEVELOPMENT);

	private constructor(private readonly container: Container) {}

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

				// Get meethods metadata
				const methodsMetadata = getMethodsMetadata(controller.constructor);

				// Get parameters metadata
				const parametersMetadata = getParametersMetadata(
					controller.constructor,
				);

				const router = express.Router();

				methodsMetadata?.forEach((methodMetadata) => {
					const method = controller[methodMetadata.key] as () => unknown;
					if (!method) {
						throw new Error("no handler found!");
					}

					const parameters = parametersMetadata[methodMetadata.key];
					const handler = this.createHandler(
						method.bind(controller),
						parameters,
					);

					/*
					 * Never forget, it's always possible to place even more than
					 * just one handler for a route (multiple middlewares)
					 */
					router.route(methodMetadata.path)[methodMetadata.method](handler);
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
		this.app.listen(port, () => {
			console.log(
				`Running in ${
					this.isDevelopment ? "development" : "production"
				} mode on port ${port} 🤙`,
			);
		});
	}

	public static create(container: Container): ExpressMetadataApplication {
		return new ExpressMetadataApplication(container);
	}

	private createHandler(
		method: (...args: unknown[]) => unknown,
		parametersMetadata: ParameterMetadata[],
	): Handler {
		return (request: Request, response: Response, next: NextFunction) => {
			const args: unknown[] = [request, response, next];
			parametersMetadata?.forEach((parameter) => {
				switch (parameter.type) {
					case "response":
						args[parameter.index] = response;
						break;
					case "request":
						args[parameter.index] = request;
						break;
					case "params":
						if (!parameter.parameterName) {
							throw new Error(
								`provide parameter name for parameter at index ${parameter.index}`,
							);
						}
						args[parameter.index] = request.params[parameter.parameterName];
						break;
					case "body":
						args[parameter.index] = request.body;
						break;
					case "next":
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
}
