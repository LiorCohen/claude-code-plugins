// src/index.ts - THE ONLY FILE WITH SIDE EFFECTS (exception to index.ts rule for entry points)
// IMPORTANT: Telemetry must be imported FIRST before any other imports
import './telemetry/index.js';
import { createServer } from './server';
import { loadConfig } from './config';

const main = async (): Promise<void> => {
  const config = loadConfig();
  const server = createServer({ config });
  await server.start();
};

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
