// App: Orchestrates application lifecycle and wires dependencies
// Delegates HTTP concerns to create_http_server.ts
import { createController } from "../controller";
import { findGreetingById, insertGreeting } from "../dal";
import { createDatabase } from "./create_database";
import { createHttpServer } from "./create_http_server";
import { createLifecycleProbes } from "./lifecycle_probes";
import { createStateMachine } from "./state_machine";

import type pino from "pino";
import type { Config } from "../config";

type AppDependencies = Readonly<{
    readonly config: Config;
    readonly logger: pino.Logger;
}>;

type App = Readonly<{
    readonly start: () => Promise<void>;
    readonly stop: () => Promise<void>;
}>;

// App lifecycle states (substates use colon convention: "PARENT:SUBSTATE")
type AppState =
    | "IDLE"
    | "STARTING:PROBES"
    | "STARTING:DATABASE"
    | "STARTING:HTTP_SERVER"
    | "RUNNING"
    | "STOPPING:HTTP_SERVER"
    | "STOPPING:DATABASE"
    | "STOPPING:PROBES"
    | "STOPPED"
    | "FAILED";

export const createApp = (deps: AppDependencies): App => {
    const { config, logger } = deps;

    const db = createDatabase({ config, logger });
    const dal = {
        findGreetingById: findGreetingById.bind(null, { db }),
        insertGreeting: insertGreeting.bind(null, { db }),
    };
    const controller = createController({ dal });

    // State machine for app lifecycle
    const stateMachine = createStateMachine<AppState>({
        initial: "IDLE",
        transitions: {
            IDLE: ["STARTING:PROBES"],
            "STARTING:PROBES": ["STARTING:DATABASE", "FAILED"],
            "STARTING:DATABASE": ["STARTING:HTTP_SERVER", "FAILED"],
            "STARTING:HTTP_SERVER": ["RUNNING", "FAILED"],
            RUNNING: ["STOPPING:HTTP_SERVER"],
            "STOPPING:HTTP_SERVER": ["STOPPING:DATABASE", "FAILED"],
            "STOPPING:DATABASE": ["STOPPING:PROBES", "FAILED"],
            "STOPPING:PROBES": ["STOPPED", "FAILED"],
            STOPPED: ["STARTING:PROBES"], // Allow restart
            FAILED: ["STARTING:PROBES"], // Allow retry
        },
    });

    // Create lifecycle probes server (health/readiness/liveness)
    const lifecycleProbes = createLifecycleProbes({
        getAppState: stateMachine.getState,
    });

    // Create HTTP server with controller
    const httpServer = createHttpServer({ controller });

    // Handle all state transitions
    stateMachine.onTransition(async (from, to) => {
        logger.info({ from, to }, "State transition");
        switch (to) {
            case "IDLE":
                // Initial state, nothing to do
                break;
            case "STARTING:PROBES":
                await lifecycleProbes.start(config.probesPort);
                logger.info(
                    { port: config.probesPort },
                    "Lifecycle probes listening",
                );
                await stateMachine.transition("STARTING:DATABASE");
                break;
            case "STARTING:DATABASE":
                await db.connect();
                await stateMachine.transition("STARTING:HTTP_SERVER");
                break;
            case "STARTING:HTTP_SERVER":
                await httpServer.start(config.port);
                await stateMachine.transition("RUNNING");
                break;
            case "RUNNING":
                logger.info({ port: config.port }, "App listening");
                break;
            case "STOPPING:HTTP_SERVER":
                await httpServer.stop();
                await stateMachine.transition("STOPPING:DATABASE");
                break;
            case "STOPPING:DATABASE":
                await db.close();
                await stateMachine.transition("STOPPING:PROBES");
                break;
            case "STOPPING:PROBES":
                await lifecycleProbes.stop();
                await stateMachine.transition("STOPPED");
                break;
            case "STOPPED":
                logger.info("App stopped");
                break;
            case "FAILED":
                logger.error("App entered failed state");
                break;
            default: {
                const exhaustiveCheck: never = to;
                throw new Error(`Unhandled state: ${exhaustiveCheck}`);
            }
        }
    });

    const start = async (): Promise<void> => {
        const state = stateMachine.getState();
        if (state === "RUNNING") {
            logger.warn("App already running");
            return;
        }
        if (state !== "IDLE" && state !== "STOPPED" && state !== "FAILED") {
            throw new Error(`Cannot start app in state: ${state}`);
        }
        try {
            await stateMachine.transition("STARTING" as AppState);
        } catch (err) {
            await stateMachine.transition("FAILED");
            throw err;
        }
    };

    const stop = async (): Promise<void> => {
        const state = stateMachine.getState();

        // Idempotent: already stopped or never started
        if (state === "STOPPED" || state === "IDLE") {
            return;
        }

        // Already stopping, wait for completion
        if (state.startsWith("STOPPING:")) {
            return;
        }

        if (state !== "RUNNING") {
            throw new Error(`Cannot stop app in state: ${state}`);
        }

        try {
            await stateMachine.transition("STOPPING" as AppState);
        } catch (err) {
            await stateMachine.transition("FAILED");
            throw err;
        }
    };

    return { start, stop };
};
