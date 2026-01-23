import dotenv from 'dotenv';

export type Config = Readonly<{
  readonly port: number;
  readonly probesPort: number;
  readonly nodeEnv: string;
  readonly logLevel: string;
}>;

export const loadConfig = (): Config => {
  // Load .env file when config is requested (not on module import)
  dotenv.config();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const probesPort = parseInt(process.env.PROBES_PORT ?? '9090', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';

  return { port, probesPort, nodeEnv, logLevel };
};
