/**
 * Database namespace command handler.
 *
 * Commands:
 *   setup         Deploy PostgreSQL to k8s
 *   teardown      Remove PostgreSQL from k8s
 *   migrate       Run migrations
 *   seed          Seed database
 *   reset         Reset (teardown + setup + migrate + seed)
 *   port-forward  Port forward to local
 *   psql          Open psql shell
 */

import type { CommandResult, GlobalOptions } from '../../lib/args.js';
import type { CommandSchema } from '../../lib/schema-validator.js';
import { validateArgs, formatValidationErrors } from '../../lib/schema-validator.js';

const ACTIONS = ['setup', 'teardown', 'migrate', 'seed', 'reset', 'port-forward', 'psql'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for database command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Database action to perform',
    },
    name: {
      type: 'string',
      description: 'Component name (e.g., "my-db")',
      pattern: '^[a-z][a-z0-9-]*$',
    },
  },
  required: ['action', 'name'],
} as const;

/**
 * Typed arguments for database commands.
 */
export interface DatabaseArgs {
  readonly action: Action;
  readonly name: string;
}

export const handleDatabase = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // All database commands require component name as first positional arg
  const componentName = args[0];

  // Validate arguments against schema
  const validation = validateArgs<DatabaseArgs>(
    { action, name: componentName },
    schema
  );

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'setup':
      const { setup } = await import('./setup.js');
      return setup(validatedArgs.name, args.slice(1));

    case 'teardown':
      const { teardown } = await import('./teardown.js');
      return teardown(validatedArgs.name, args.slice(1));

    case 'migrate':
      const { migrate } = await import('./migrate.js');
      return migrate(validatedArgs.name, args.slice(1));

    case 'seed':
      const { seed } = await import('./seed.js');
      return seed(validatedArgs.name, args.slice(1));

    case 'reset':
      const { reset } = await import('./reset.js');
      return reset(validatedArgs.name, args.slice(1));

    case 'port-forward':
      const { portForward } = await import('./port-forward.js');
      return portForward(validatedArgs.name, args.slice(1));

    case 'psql':
      const { psql } = await import('./psql.js');
      return psql(validatedArgs.name, args.slice(1));

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
