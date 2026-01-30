/**
 * Spec validation command.
 *
 * Usage:
 *   sdd-system spec validate <spec.md>
 *   sdd-system spec validate --all --specs-dir specs/
 */

import type { CommandResult } from '../../lib/args.js';
import { parseNamedArgs } from '../../lib/args.js';
import { parseFrontmatter } from '../../lib/frontmatter.js';
import { findSpecFiles, directoryExists } from '../../lib/spec-utils.js';
import { exists, readText } from '../../lib/fs.js';
import {
  REQUIRED_FIELDS,
  VALID_STATUSES,
  PLACEHOLDER_ISSUES,
  type ValidationError,
} from '../../types/spec.js';

/**
 * Validate a single spec file. Returns list of errors.
 */
const validateSpecFile = async (specPath: string): Promise<readonly ValidationError[]> => {
  if (!(await exists(specPath))) {
    return [{ file: specPath, message: 'File not found' }];
  }

  const content = await readText(specPath);
  const fm = parseFrontmatter(content);

  if (!fm) {
    return [{ file: specPath, message: 'Missing frontmatter' }];
  }

  // Check required fields
  const missingFieldErrors: readonly ValidationError[] = REQUIRED_FIELDS.filter(
    (field) => !fm[field]
  ).map((field) => ({ file: specPath, message: `Missing required field '${field}'` }));

  // Check status validity
  const status = fm['status'];
  const statusErrors: readonly ValidationError[] =
    status && !(VALID_STATUSES as readonly string[]).includes(status)
      ? [
          {
            file: specPath,
            message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
          },
        ]
      : [];

  // Check issue placeholder
  const issue = fm['issue'];
  const issueErrors: readonly ValidationError[] =
    issue && (PLACEHOLDER_ISSUES as readonly string[]).includes(issue)
      ? [{ file: specPath, message: 'Issue field is placeholder. Must reference actual issue.' }]
      : [];

  return [...missingFieldErrors, ...statusErrors, ...issueErrors];
};

export const validateSpec = async (args: readonly string[]): Promise<CommandResult> => {
  const { named, positional } = parseNamedArgs(args);

  const all = named['all'] === 'true';
  const specsDir = named['specs-dir'] ?? 'specs/';
  const specPath = positional[0];

  if (all) {
    if (!(await directoryExists(specsDir))) {
      return {
        success: false,
        error: `Specs directory not found: ${specsDir}`,
      };
    }

    const specs = await findSpecFiles(specsDir);
    const validationResults = await Promise.all(specs.map((spec) => validateSpecFile(spec.path)));
    const allErrors = validationResults.flat();

    if (allErrors.length > 0) {
      const errorMessages = allErrors
        .map((error) => `  - ${error.file}: ${error.message}`)
        .join('\n');

      return {
        success: false,
        error: `Validation errors:\n${errorMessages}`,
        data: { errors: allErrors, totalSpecs: specs.length },
      };
    }

    return {
      success: true,
      message: `All ${specs.length} specs are valid`,
      data: { validatedSpecs: specs.length },
    };
  }

  if (specPath) {
    const errors = await validateSpecFile(specPath);
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => `  - ${error.message}`).join('\n');
      return {
        success: false,
        error: `Validation errors:\n${errorMessages}`,
        data: { errors },
      };
    }
    return {
      success: true,
      message: `${specPath} is valid`,
    };
  }

  return {
    success: false,
    error: 'Usage: sdd-system spec validate <path-to-spec.md>\n       sdd-system spec validate --all --specs-dir specs/',
  };
};
