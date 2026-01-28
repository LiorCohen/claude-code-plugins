// HTTP Handler: Greetings
// Handles /greetings endpoints as defined in OpenAPI contract
import { Router } from 'express';
import type { Dependencies } from '../../model';
import { createGreeting, getGreeting } from '../../model/use-cases';

export type GreetingsHandlerDeps = {
  readonly modelDeps: Dependencies;
};

export const createGreetingsRouter = (deps: GreetingsHandlerDeps): Router => {
  const router = Router();

  // POST /greetings - Create a new greeting
  router.post('/', async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Name is required and must be a string',
          },
        });
        return;
      }

      if (name.length < 1 || name.length > 100) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Name must be between 1 and 100 characters',
          },
        });
        return;
      }

      const greeting = await createGreeting(deps.modelDeps, { name });

      res.status(201).json({
        id: greeting.id,
        name: greeting.name,
        message: greeting.message,
        createdAt: greeting.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /greetings/:id - Get a greeting by ID
  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;

      const greeting = await getGreeting(deps.modelDeps, id);

      if (!greeting) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Greeting not found',
          },
        });
        return;
      }

      res.status(200).json({
        id: greeting.id,
        name: greeting.name,
        message: greeting.message,
        createdAt: greeting.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
