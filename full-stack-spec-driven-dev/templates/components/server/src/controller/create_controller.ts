// Controller: Assembles routers and creates Dependencies for Model
// Imports routers from http_handlers and wires them together
import type { Router, Application } from 'express';
import { Router as createRouter } from 'express';
import type { Dependencies } from '../model';
import { createUsersRouter } from './http_handlers';

export type ControllerDependencies = {
  readonly dal: {
    readonly findUserByEmail: Dependencies['findUserByEmail'];
    readonly insertUser: Dependencies['insertUser'];
  };
};

export type Controller = {
  readonly router: Router;
  // Health checks - infrastructure endpoints, not in OpenAPI contract
  readonly handleHealth: () => { readonly status: string };
  readonly handleReadiness: () => { readonly status: string };
  readonly handleLiveness: () => { readonly status: string };
};

export const createController = (deps: ControllerDependencies): Controller => {
  // Create Dependencies object for Model use cases
  const modelDeps: Dependencies = {
    findUserByEmail: deps.dal.findUserByEmail,
    insertUser: deps.dal.insertUser,
  };

  // Create main router and mount namespace routers
  const router = createRouter();

  // Mount namespace routers from http_handlers
  const usersRouter = createUsersRouter({ modelDeps });
  router.use('/users', usersRouter);

  return {
    router,
    // Health check endpoints - infrastructure only, not in OpenAPI contract
    handleHealth: () => ({ status: 'healthy' }),
    handleReadiness: () => ({ status: 'ready' }),
    handleLiveness: () => ({ status: 'alive' }),
  };
};
