/**
 * Permissions namespace command handler.
 *
 * Commands:
 *   configure   Merge SDD recommended permissions into project settings
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import type { CommandSchema } from '@/lib/schema-validator';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';

const ACTIONS = ['configure'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for permissions command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Permissions action to perform',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for permissions commands.
 */
export interface PermissionsArgs {
  readonly action: Action;
}

export const handlePermissions = async (
  action: string,
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // Validate arguments against schema
  const validation = validateArgs<PermissionsArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'configure':
      const { configurePermissions } = await import('./configure');
      return configurePermissions();

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
