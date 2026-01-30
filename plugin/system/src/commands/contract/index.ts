/**
 * Contract namespace command handler.
 *
 * Commands:
 *   generate-types   Generate TypeScript types from OpenAPI spec
 *   validate         Validate OpenAPI spec with Spectral
 */

import type { CommandResult, GlobalOptions } from '../../lib/args.js';
import type { CommandSchema } from '../../lib/schema-validator.js';
import { validateArgs, formatValidationErrors } from '../../lib/schema-validator.js';

const ACTIONS = ['generate-types', 'validate'] as const;
type Action = (typeof ACTIONS)[number];

/**
 * JSON Schema for contract command arguments.
 */
export const schema: CommandSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description: 'Contract action to perform',
    },
    name: {
      type: 'string',
      description: 'Component name (e.g., "my-api")',
      pattern: '^[a-z][a-z0-9-]*$',
    },
  },
  required: ['action', 'name'],
} as const;

/**
 * Typed arguments for contract commands.
 */
export interface ContractArgs {
  readonly action: Action;
  readonly name: string;
}

export const handleContract = async (
  action: string,
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  // All contract commands require component name as first positional arg
  const componentName = args[0];

  // Validate arguments against schema
  const validation = validateArgs<ContractArgs>(
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
    case 'generate-types':
      const { generateTypes } = await import('./generate-types.js');
      return generateTypes(validatedArgs.name, args.slice(1));

    case 'validate':
      const { validate } = await import('./validate.js');
      return validate(validatedArgs.name, args.slice(1));

    default:
      return { success: false, error: `Unhandled action: ${validatedArgs.action}` };
  }
};
