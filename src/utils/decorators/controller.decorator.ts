import { decorate, injectable } from "inversify";
import { CONTROLLER } from "../constants";
import { ControllerMetadata } from "../interfaces/controller-metadata";

export const controller = (path: string) => {
  return (target: NewableFunction): void => {
    const currentMetadata: ControllerMetadata = {
      path,
      target,
    };

    decorate(injectable(), target);

    // Define metadata on the controller (the route url)
    Reflect.defineMetadata(CONTROLLER, currentMetadata, target);

    // Controllers array will be stored in Reflect itself
    const previousMetadata: Array<ControllerMetadata> =
      (Reflect.getMetadata(CONTROLLER, Reflect) as Array<ControllerMetadata>) ||
      [];

    // Define metadata over Reflect (list of all controllers)
    Reflect.defineMetadata(
      CONTROLLER,
      [currentMetadata, ...previousMetadata],
      Reflect,
    );
  };
};

export const getControllers = (): NewableFunction[] => {
  return (Reflect.getMetadata(CONTROLLER, Reflect) || []).map(
    (metadata: { target: NewableFunction }) =>
      metadata.target as NewableFunction,
  );
};

export const getControllerMetadata = (
  controller: NewableFunction,
): ControllerMetadata => Reflect.getOwnMetadata(CONTROLLER, controller);
