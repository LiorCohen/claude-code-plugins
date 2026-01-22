// src/index.ts - THE ONLY FILE WITH SIDE EFFECTS (exception to index.ts rule for entry points)
// IMPORTANT: Telemetry must be imported FIRST before any other imports
import { createBaseLogger, createLogger } from "./telemetry";
import { createApp } from "./app";
import { loadConfig } from "./config";

const main = async (): Promise<void> => {
    const config = loadConfig();
    const baseLogger = createBaseLogger(config);
    const logger = createLogger(baseLogger, "app");

    const app = createApp({ config, logger });
    await app.start();
};

main().catch((error) => {
    console.error("Failed to start app:", error);
    process.exit(1);
});
