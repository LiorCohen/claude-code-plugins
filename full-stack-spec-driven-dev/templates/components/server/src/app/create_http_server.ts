// HTTP Server: Express application setup and lifecycle
// Isolates all HTTP/Express concerns from app orchestration
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import type { Controller } from '../controller';

export type HttpServerDependencies = Readonly<{
  readonly controller: Controller;
  readonly getAppState: () => string;
}>;

export type HttpServer = Readonly<{
  readonly start: (port: number) => Promise<void>;
  readonly stop: () => Promise<void>;
}>;

export const createHttpServer = (deps: HttpServerDependencies): HttpServer => {
  const { controller, getAppState } = deps;

  let server: Server | null = null;
  const app: Express = express();

  // Middleware
  app.use(express.json());

  // Health check endpoints (infrastructure, not in OpenAPI)
  app.get('/health', (_req: Request, res: Response) => {
    res.json(controller.handleHealth());
  });

  app.get('/readiness', (_req: Request, res: Response) => {
    // Only ready when running
    const state = getAppState();
    if (state === 'running') {
      res.json(controller.handleReadiness());
    } else {
      res.status(503).json({ status: 'not_ready', state });
    }
  });

  app.get('/liveness', (_req: Request, res: Response) => {
    // Alive unless failed
    const state = getAppState();
    if (state !== 'failed') {
      res.json(controller.handleLiveness());
    } else {
      res.status(503).json({ status: 'unhealthy', state });
    }
  });

  // Mount API routes
  app.use('/api/v1', controller.router);

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  const start = async (port: number): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        resolve();
      });
      server.on('error', reject);
    });
  };

  const stop = async (): Promise<void> => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server!.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    server = null;
  };

  return { start, stop };
};
