import type { Config } from '../config';

type ServerDependencies = Readonly<{
  readonly config: Config;
}>;

type Server = Readonly<{
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
}>;

export const createServer = (deps: ServerDependencies): Server => {
  const { config } = deps;

  const start = async (): Promise<void> => {
    console.log(`Server starting on port ${config.port}...`);
    // TODO: Initialize Express app, middleware, routes
  };

  const stop = async (): Promise<void> => {
    console.log('Server stopping...');
    // TODO: Graceful shutdown
  };

  return { start, stop };
};
