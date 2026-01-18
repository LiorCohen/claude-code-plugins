// Controller: Request/response handling
// Creates Dependencies object for Model use cases
// Handler names come from OpenAPI operationId with 'handle' prefix
import type { Dependencies } from '../model';
import { createUser } from '../model';

export type ControllerDependencies = {
  readonly dal: {
    readonly findUserByEmail: Dependencies['findUserByEmail'];
    readonly insertUser: Dependencies['insertUser'];
  };
};

export type Request<T = unknown> = {
  readonly body: T;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
};

export type Response<T = unknown> = {
  readonly status: number;
  readonly body: T;
};

export type Controller = {
  // Handler name comes from OpenAPI operationId: "createUser" -> handleCreateUser
  readonly handleCreateUser: (req: Request<{ readonly email: string; readonly name: string }>) => Promise<Response>;
  // Health checks - infrastructure endpoints, not in OpenAPI contract
  readonly handleHealth: () => Response<{ readonly status: string }>;
  readonly handleReadiness: () => Response<{ readonly status: string }>;
  readonly handleLiveness: () => Response<{ readonly status: string }>;
};

export const createController = (deps: ControllerDependencies): Controller => {
  // Create Dependencies object for Model use cases
  const modelDeps: Dependencies = {
    findUserByEmail: deps.dal.findUserByEmail,
    insertUser: deps.dal.insertUser,
  };

  return {
    handleCreateUser: async (req) => {
      const result = await createUser(modelDeps, {
        email: req.body.email,
        name: req.body.name,
      });
      return result.success
        ? { status: 201, body: { data: result.user } }
        : { status: 409, body: { error: { code: 'email_exists', message: 'User with this email already exists' } } };
    },

    // Health check endpoints - infrastructure only, not in OpenAPI contract
    handleHealth: () => ({ status: 200, body: { status: 'healthy' } }),
    handleReadiness: () => ({ status: 200, body: { status: 'ready' } }),
    handleLiveness: () => ({ status: 200, body: { status: 'alive' } }),
  };
};
