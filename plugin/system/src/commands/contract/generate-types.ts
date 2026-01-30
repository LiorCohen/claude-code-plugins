/**
 * Contract generate-types command.
 *
 * Generate TypeScript types from OpenAPI spec using openapi-typescript.
 *
 * Usage:
 *   sdd-system contract generate-types <component-name>
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import type { CommandResult } from '../../lib/args.js';
import { parseNamedArgs } from '../../lib/args.js';
import { exists, ensureDir } from '../../lib/fs.js';
import { findProjectRoot } from '../../lib/config.js';

export const generateTypes = async (
  componentName: string,
  args: readonly string[]
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  // Find project root
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    return {
      success: false,
      error: 'Could not find project root (no package.json found)',
    };
  }

  // Find component directory
  const componentDir = path.join(projectRoot, 'components', componentName);

  if (!(await exists(componentDir))) {
    return {
      success: false,
      error: `Component directory not found: ${componentDir}`,
    };
  }

  // Determine spec file location
  const specFile = named['spec'] ?? path.join(componentDir, 'openapi.yaml');
  if (!(await exists(specFile))) {
    return {
      success: false,
      error: `OpenAPI spec not found: ${specFile}`,
    };
  }

  // Determine output location
  const outputDir = named['output'] ?? path.join(componentDir, 'generated');
  const outputFile = path.join(outputDir, 'api-types.ts');

  console.log(`Generating TypeScript types from: ${specFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  try {
    // Ensure output directory exists
    await ensureDir(outputDir);

    // Run openapi-typescript
    // This assumes openapi-typescript is installed in the project
    execSync(`npx openapi-typescript "${specFile}" -o "${outputFile}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    console.log('');
    console.log('Type generation complete!');

    return {
      success: true,
      message: `Generated types at ${outputFile}`,
      data: {
        specFile,
        outputFile,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Type generation failed: ${errorMessage}`,
    };
  }
};
