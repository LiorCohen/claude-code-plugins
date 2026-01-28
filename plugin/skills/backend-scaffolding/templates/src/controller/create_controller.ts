// Controller: Assembles routers and creates Dependencies for Model
// Imports routers from http_handlers and wires them together
import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { Dependencies } from '../model';
import { createGreetingsRouter } from './http_handlers';

export type ControllerDependencies = {
  readonly dal: {
    readonly findGreetingById: Dependencies['findGreetingById'];
    readonly insertGreeting: Dependencies['insertGreeting'];
  };
};

export type Controller = {
  readonly router: Router;
};

export const createController = (deps: ControllerDependencies): Controller => {
  // Create Dependencies object for Model use cases
  const modelDeps: Dependencies = {
    findGreetingById: deps.dal.findGreetingById,
    insertGreeting: deps.dal.insertGreeting,
  };

  // Create main router and mount namespace routers
  const router = createRouter();

  // Mount namespace routers from http_handlers
  const greetingsRouter = createGreetingsRouter({ modelDeps });
  router.use('/greetings', greetingsRouter);

  return { router };
};
