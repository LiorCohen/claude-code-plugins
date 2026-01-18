// HTTP handlers for /users namespace
// Each handler corresponds to an OpenAPI operationId with 'handle' prefix
import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { Dependencies } from '../../model';
import { createUser } from '../../model';

export type UsersHandlerDeps = {
  readonly modelDeps: Dependencies;
};

export const createUsersRouter = (deps: UsersHandlerDeps): Router => {
  const router = createRouter();

  // POST /users - operationId: createUser -> handleCreateUser
  router.post('/', async (req, res) => {
    const result = await createUser(deps.modelDeps, {
      email: req.body.email,
      name: req.body.name,
    });

    if (result.success) {
      res.status(201).json({ data: result.user });
    } else {
      res.status(409).json({ error: { code: 'email_exists', message: 'User with this email already exists' } });
    }
  });

  return router;
};
