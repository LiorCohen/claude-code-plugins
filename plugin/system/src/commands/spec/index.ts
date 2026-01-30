/**
 * Spec namespace command handler.
 *
 * Commands:
 *   validate   Validate spec frontmatter/structure
 *   index      Generate specs/INDEX.md
 *   snapshot   Create project snapshot
 */

import type { CommandResult, GlobalOptions } from '../../lib/args.js';
import type { CommandSchema } from '../../lib/schema-validator.js';
import { validateArgs, formatValidationErrors } from '../../lib/schema-validator.js';

const ACTIONS = ['validate', 'index', 'snapshot'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for spec command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Spec action to perform',
    },
  },
  required: ['action'],
} as const;

/**
 * Typed arguments for spec commands.
 */
export interface SpecArgs {
  readonly action: Action;
}

export const handleSpec = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // Validate arguments against schema
  const validation = validateArgs<SpecArgs>({ action }, schema);

  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid arguments:\n${formatValidationErrors(validation.errors!)}`,
    };
  }

  const validatedArgs = validation.data!;

  switch (validatedArgs.action) {
    case 'validate':
      // Dynamically import to avoid loading all commands upfront
      const { validateSpec } = await import('./validate.js');
      return validateSpec(args);

    case 'index':
      const { generateIndex } = await import('./generate-index.js');
      return generateIndex(args);

    case 'snapshot':
      const { generateSnapshot } = await import('./generate-snapshot.js');
      return generateSnapshot(args);

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
