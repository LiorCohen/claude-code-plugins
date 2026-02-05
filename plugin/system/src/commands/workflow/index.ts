/**
 * Workflow namespace command handler.
 *
 * Commands:
 *   check-gate   Check if prerequisites are met to advance to target phase
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import type { CommandSchema } from '@/lib/schema-validator';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';

const ACTIONS = ['check-gate'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for workflow command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Workflow action to perform',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for workflow commands.
 */
export interface WorkflowArgs {
  readonly action: Action;
}

export const handleWorkflow = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // Validate arguments against schema
  const validation = validateArgs<WorkflowArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'check-gate':
      // Dynamically import to avoid loading all commands upfront
      const { checkGate } = await import('./check-gate');
      return checkGate(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
