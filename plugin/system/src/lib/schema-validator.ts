/**
 * JSON Schema validation utility for CLI command arguments.
 *
 * Provides runtime validation of command arguments against JSON Schema definitions.
 * Schemas are embedded as consts in command files for type safety and co-location.
 */

/**
 * JSON Schema property definition.
 */
export interface SchemaProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly items?: SchemaProperty;
  readonly default?: unknown;
}

/**
 * JSON Schema definition for command arguments.
 */
export interface CommandSchema {
  readonly $schema?: string;
  readonly type: 'object';
  readonly properties: Readonly<Record<string, SchemaProperty>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

/**
 * Validation error details.
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly expected?: string;
  readonly received?: string;
}

/**
 * Validation result.
 */
export interface ValidationResult<T> {
  readonly valid: boolean;
  readonly data?: T;
  readonly errors?: readonly ValidationError[];
}

/**
 * Validate a value against a schema property.
 */
const validateProperty = (
  value: unknown,
  property: SchemaProperty,
  fieldName: string
): ValidationError | null => {
  // Type check
  if (property.type === 'string') {
    if (typeof value !== 'string') {
      return {
        field: fieldName,
        message: `Expected string, got ${typeof value}`,
        expected: 'string',
        received: typeof value,
      };
    }

    // Enum check
    if (property.enum && !property.enum.includes(value)) {
      return {
        field: fieldName,
        message: `Invalid value. Must be one of: ${property.enum.join(', ')}`,
        expected: property.enum.join(' | '),
        received: value,
      };
    }

    // Pattern check
    if (property.pattern && !new RegExp(property.pattern).test(value)) {
      return {
        field: fieldName,
        message: `Value does not match pattern: ${property.pattern}`,
        expected: property.pattern,
        received: value,
      };
    }

    // Length checks
    if (property.minLength !== undefined && value.length < property.minLength) {
      return {
        field: fieldName,
        message: `Value too short. Minimum length: ${property.minLength}`,
        expected: `>= ${property.minLength} characters`,
        received: `${value.length} characters`,
      };
    }

    if (property.maxLength !== undefined && value.length > property.maxLength) {
      return {
        field: fieldName,
        message: `Value too long. Maximum length: ${property.maxLength}`,
        expected: `<= ${property.maxLength} characters`,
        received: `${value.length} characters`,
      };
    }
  }

  if (property.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        field: fieldName,
        message: `Expected number, got ${typeof value}`,
        expected: 'number',
        received: typeof value,
      };
    }

    if (property.minimum !== undefined && value < property.minimum) {
      return {
        field: fieldName,
        message: `Value too small. Minimum: ${property.minimum}`,
        expected: `>= ${property.minimum}`,
        received: String(value),
      };
    }

    if (property.maximum !== undefined && value > property.maximum) {
      return {
        field: fieldName,
        message: `Value too large. Maximum: ${property.maximum}`,
        expected: `<= ${property.maximum}`,
        received: String(value),
      };
    }
  }

  if (property.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return {
        field: fieldName,
        message: `Expected boolean, got ${typeof value}`,
        expected: 'boolean',
        received: typeof value,
      };
    }
  }

  if (property.type === 'array') {
    if (!Array.isArray(value)) {
      return {
        field: fieldName,
        message: `Expected array, got ${typeof value}`,
        expected: 'array',
        received: typeof value,
      };
    }

    // Validate array items if schema provided
    if (property.items) {
      for (let i = 0; i < value.length; i++) {
        const itemError = validateProperty(value[i], property.items, `${fieldName}[${i}]`);
        if (itemError) {
          return itemError;
        }
      }
    }
  }

  return null;
};

/**
 * Validate command arguments against a schema.
 *
 * @param args - The arguments object to validate
 * @param schema - The JSON Schema to validate against
 * @returns ValidationResult with valid flag, data if valid, or errors if invalid
 */
export const validateArgs = <T>(
  args: Readonly<Record<string, unknown>>,
  schema: CommandSchema
): ValidationResult<T> => {
  const errors: ValidationError[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (args[field] === undefined || args[field] === null || args[field] === '') {
        const property = schema.properties[field];
        const description = property?.description ? ` (${property.description})` : '';
        errors.push({
          field,
          message: `Required field missing${description}`,
          expected: property?.type ?? 'value',
        });
      }
    }
  }

  // Validate each provided field
  for (const [field, value] of Object.entries(args)) {
    const property = schema.properties[field];

    // Skip unknown fields if additionalProperties is not explicitly false
    if (!property) {
      if (schema.additionalProperties === false) {
        errors.push({
          field,
          message: `Unknown field`,
          received: field,
        });
      }
      continue;
    }

    // Skip undefined/null values (handled by required check)
    if (value === undefined || value === null) {
      continue;
    }

    const error = validateProperty(value, property, field);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: args as T };
};

/**
 * Format validation errors as a human-readable string.
 */
export const formatValidationErrors = (errors: readonly ValidationError[]): string => {
  return errors
    .map((e) => {
      const parts = [`  ${e.field}: ${e.message}`];
      if (e.expected) {
        parts.push(`    Expected: ${e.expected}`);
      }
      if (e.received) {
        parts.push(`    Received: ${e.received}`);
      }
      return parts.join('\n');
    })
    .join('\n');
};

/**
 * Generate help text from a schema definition.
 */
export const generateSchemaHelp = (schema: CommandSchema, commandName: string): string => {
  const lines: string[] = [`Usage: ${commandName} [options]`, ''];

  const requiredSet = new Set(schema.required ?? []);

  // Arguments section
  const args = Object.entries(schema.properties).filter(([key]) => requiredSet.has(key));
  if (args.length > 0) {
    lines.push('Arguments:');
    for (const [key, prop] of args) {
      const enumStr = prop.enum ? ` (${prop.enum.join('|')})` : '';
      const desc = prop.description ?? '';
      lines.push(`  <${key}>${enumStr}  ${desc}`);
    }
    lines.push('');
  }

  // Options section
  const opts = Object.entries(schema.properties).filter(([key]) => !requiredSet.has(key));
  if (opts.length > 0) {
    lines.push('Options:');
    for (const [key, prop] of opts) {
      const enumStr = prop.enum ? ` (${prop.enum.join('|')})` : '';
      const defaultStr = prop.default !== undefined ? ` [default: ${prop.default}]` : '';
      const desc = prop.description ?? '';
      lines.push(`  --${key}${enumStr}  ${desc}${defaultStr}`);
    }
    lines.push('');
  }

  return lines.join('\n');
};
