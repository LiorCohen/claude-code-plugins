/**
 * Config validate command.
 *
 * Validate config files against JSON Schema.
 *
 * Usage:
 *   sdd-system config validate [--env <env>]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import Ajv, { type ErrorObject } from 'ajv';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

interface ValidationResult {
  readonly env: string;
  readonly valid: boolean;
  readonly errors?: readonly string[];
}

export const validate = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const targetEnv = named['env'];
  const configDir = named['config-dir'] ?? process.cwd();

  const envsDir = join(configDir, 'components', 'config', 'envs');
  const schemasDir = join(configDir, 'components', 'config', 'schemas');
  const schemaPath = join(schemasDir, 'config.schema.json');

  // Check envs directory exists
  if (!existsSync(envsDir)) {
    return {
      success: false,
      error: `Config envs directory not found: ${envsDir}`,
    };
  }

  // Check schema exists
  if (!existsSync(schemaPath)) {
    return {
      success: false,
      error: `Config schema not found: ${schemaPath}`,
    };
  }

  // Load schema
  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    // Remove $schema property as ajv doesn't need it for validation
    // and default ajv doesn't support 2020-12 draft
    delete schema['$schema'];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to parse schema: ${errorMessage}`,
    };
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validateFn = ajv.compile(schema);

  // Get environments to validate
  const envDirs = targetEnv
    ? [targetEnv]
    : readdirSync(envsDir).filter((name) => {
        const envPath = join(envsDir, name);
        return statSync(envPath).isDirectory();
      });

  const results: ValidationResult[] = [];
  let hasErrors = false;

  for (const env of envDirs) {
    const configPath = join(envsDir, env, 'config.yaml');

    if (!existsSync(configPath)) {
      results.push({
        env,
        valid: false,
        errors: [`Config file not found: ${configPath}`],
      });
      hasErrors = true;
      continue;
    }

    try {
      const config = parse(readFileSync(configPath, 'utf-8')) ?? {};

      if (!validateFn(config)) {
        const errors =
          validateFn.errors?.map((e: ErrorObject) => `${e.instancePath || '/'}: ${e.message}`) ?? [];
        results.push({ env, valid: false, errors });
        hasErrors = true;
      } else {
        results.push({ env, valid: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      results.push({
        env,
        valid: false,
        errors: [`Failed to parse YAML: ${errorMessage}`],
      });
      hasErrors = true;
    }
  }

  if (options.json) {
    return {
      success: !hasErrors,
      data: { results },
      error: hasErrors ? 'Validation failed for one or more environments' : undefined,
    };
  }

  // Text output
  console.log('Config Validation Results');
  console.log('='.repeat(40));

  for (const result of results) {
    if (result.valid) {
      console.log(`\n✓ ${result.env}: Valid`);
    } else {
      console.log(`\n✗ ${result.env}: Invalid`);
      for (const error of result.errors ?? []) {
        console.log(`    - ${error}`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    return {
      success: false,
      error: 'Validation failed for one or more environments',
    };
  }

  return {
    success: true,
    message: `All ${results.length} environment(s) valid`,
  };
};
