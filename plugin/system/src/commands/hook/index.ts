/**
 * Hook namespace command handler.
 *
 * Commands:
 *   validate-write   PreToolUse hook: auto-approve/block writes
 *   prompt-commit    PostToolUse hook: commit prompts
 */

import type { CommandResult, GlobalOptions } from '../../lib/args.js';
import type { CommandSchema } from '../../lib/schema-validator.js';
import { validateArgs, formatValidationErrors } from '../../lib/schema-validator.js';

const ACTIONS = ['validate-write', 'prompt-commit'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for hook command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Hook action to perform',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for hook commands.
 */
export interface HookArgs {
  readonly action: Action;
}

export const handleHook = async (
  action: string,
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // Validate arguments against schema
  const validation = validateArgs<HookArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'validate-write':
      const { validateWrite } = await import('./validate-write.js');
      return validateWrite();

    case 'prompt-commit':
      const { promptCommit } = await import('./prompt-commit.js');
      return promptCommit();

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
