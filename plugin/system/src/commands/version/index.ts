/**
 * Version namespace command handler.
 *
 * Commands:
 *   bump   Bump version (major|minor|patch)
 */

import type { CommandResult, GlobalOptions } from '../../lib/args.js';
import type { CommandSchema } from '../../lib/schema-validator.js';
import { validateArgs, formatValidationErrors } from '../../lib/schema-validator.js';

const ACTIONS = ['bump'] as const;
type Action = (typeof ACTIONS)[number];

const BUMP_TYPES = ['major', 'minor', 'patch'] as const;

/**
 * JSON Schema for version command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Version action to perform',
    },
    type: {
      type: 'string',
      enum: BUMP_TYPES,
      description: 'Version bump type (major|minor|patch)',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for version commands.
 */
export interface VersionArgs {
  readonly action: Action;
  readonly type?: (typeof BUMP_TYPES)[number];
}

export const handleVersion = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // Validate arguments against schema
  const validation = validateArgs<VersionArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'bump':
      const { bumpVersion } = await import('./bump.js');
      return bumpVersion(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
