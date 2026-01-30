#!/usr/bin/env node
/**
 * SDD System CLI - Unified command-line tool for SDD plugin operations.
 *
 * Usage: sdd-system <namespace> <action> [args] [options]
 *
 * Namespaces:
 *   scaffolding   Project and domain scaffolding
 *   spec          Spec validation, indexing, snapshots
 *   version       Version bumping
 *   hook          Hook handlers (validate-write, prompt-commit)
 *   database      Database component operations
 *   contract      Contract component operations
 */

import { parseArgs, type CommandResult, type GlobalOptions, outputResult } from './lib/args.js';
import { createLogger } from './lib/logger.js';

// Command imports
import { handleSpec } from './commands/spec/index.js';
import { handleScaffolding } from './commands/scaffolding/index.js';
import { handleVersion } from './commands/version/index.js';
import { handleHook } from './commands/hook/index.js';
import { handleDatabase } from './commands/database/index.js';
import { handleContract } from './commands/contract/index.js';

const NAMESPACES = ['scaffolding', 'spec', 'version', 'hook', 'database', 'contract'] as const;
type Namespace = (typeof NAMESPACES)[number];

const HELP_TEXT = `
SDD System CLI - Unified command-line tool for SDD plugin operations

Usage: sdd-system <namespace> <action> [args] [options]

Namespaces:
  scaffolding   Project and domain scaffolding
    project     Create new SDD project structure
    domain      Populate domain specs from config

  spec          Spec validation, indexing, snapshots
    validate    Validate spec frontmatter/structure
    index       Generate specs/INDEX.md
    snapshot    Create project snapshot

  version       Version bumping
    bump        Bump version (major|minor|patch)

  hook          Hook handlers (called by hook-runner.sh)
    validate-write   PreToolUse hook: auto-approve/block writes
    prompt-commit    PostToolUse hook: commit prompts

  database      Database component operations
    setup       Deploy PostgreSQL to k8s
    teardown    Remove PostgreSQL from k8s
    migrate     Run migrations
    seed        Seed database
    reset       Reset (teardown + setup + migrate + seed)
    port-forward  Port forward to local
    psql        Open psql shell

  contract      Contract component operations
    generate-types  Generate TypeScript types from OpenAPI spec
    validate        Validate OpenAPI spec

Global Options:
  --json        JSON output mode
  --verbose     Verbose logging
  --help        Show help

Examples:
  sdd-system spec validate specs/feature.md
  sdd-system spec validate --all --specs-dir specs/
  sdd-system scaffolding project --config config.json
  sdd-system version bump patch
  sdd-system database setup my-db
`.trim();

type CommandHandler = (
  action: string,
  args: readonly string[],
  options: GlobalOptions
) => Promise<CommandResult>;

const COMMAND_HANDLERS: Readonly<Record<Namespace, CommandHandler>> = {
  scaffolding: handleScaffolding,
  spec: handleSpec,
  version: handleVersion,
  hook: handleHook,
  database: handleDatabase,
  contract: handleContract,
};

const showHelp = (options: GlobalOptions): CommandResult => {
  if (options.json) {
    return {
      success: true,
      data: {
        namespaces: NAMESPACES,
        usage: 'sdd-system <namespace> <action> [args] [options]',
      },
    };
  }
  console.log(HELP_TEXT);
  return { success: true };
};

const main = async (): Promise<number> => {
  const { namespace, action, args, options } = parseArgs(process.argv.slice(2));
  const logger = createLogger(options);

  // Handle help flag
  if (options.help || !namespace) {
    const result = showHelp(options);
    outputResult(result, options);
    return result.success ? 0 : 1;
  }

  // Validate namespace
  if (!NAMESPACES.includes(namespace as Namespace)) {
    const result: CommandResult = {
      success: false,
      error: `Unknown namespace: ${namespace}. Available: ${NAMESPACES.join(', ')}`,
    };
    outputResult(result, options);
    return 1;
  }

  // Get handler
  const handler = COMMAND_HANDLERS[namespace as Namespace];

  if (!action) {
    const result: CommandResult = {
      success: false,
      error: `Missing action for namespace '${namespace}'. Use --help for available actions.`,
    };
    outputResult(result, options);
    return 1;
  }

  try {
    logger.debug(`Executing: ${namespace} ${action}`, { args, options });
    const result = await handler(action, args, options);
    outputResult(result, options);
    return result.success ? 0 : 1;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Command failed: ${errorMessage}`);
    const result: CommandResult = {
      success: false,
      error: errorMessage,
    };
    outputResult(result, options);
    return 1;
  }
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
