#!/usr/bin/env npx ts-node --esm
/**
 * Validate spec files for required fields and format.
 *
 * Usage: npx ts-node --esm validate-spec.ts <path-to-spec.md>
 *        npx ts-node --esm validate-spec.ts --all --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import { parseFrontmatter } from './lib/frontmatter.js';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

const REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated'] as const;
const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived'] as const;
const PLACEHOLDER_ISSUES = ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}'] as const;

interface ValidationError {
  readonly file: string;
  readonly message: string;
}

/**
 * Validate a spec file. Returns list of errors.
 */
const validateSpec = async (specPath: string): Promise<readonly ValidationError[]> => {
  const errors: ValidationError[] = [];

  try {
    await fs.access(specPath);
  } catch {
    return [{ file: specPath, message: 'File not found' }];
  }

  const content = await fs.readFile(specPath, 'utf-8');
  const fm = parseFrontmatter(content);

  if (!fm) {
    return [{ file: specPath, message: 'Missing frontmatter' }];
  }

  for (const field of REQUIRED_FIELDS) {
    if (!fm[field]) {
      errors.push({ file: specPath, message: `Missing required field '${field}'` });
    }
  }

  const status = fm['status'];
  if (status && !(VALID_STATUSES as readonly string[]).includes(status)) {
    errors.push({
      file: specPath,
      message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  const issue = fm['issue'];
  if (issue && (PLACEHOLDER_ISSUES as readonly string[]).includes(issue)) {
    errors.push({
      file: specPath,
      message: 'Issue field is placeholder. Must reference actual issue.',
    });
  }

  return errors;
};

/**
 * Parse command line arguments.
 */
const parseArgs = (args: readonly string[]): { all: boolean; specsDir: string; path?: string } => {
  let all = false;
  let specsDir = 'specs/';
  let specPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      all = true;
    } else if (arg === '--specs-dir') {
      specsDir = args[i + 1] ?? 'specs/';
      i++;
    } else if (!arg?.startsWith('-')) {
      specPath = arg;
    }
  }

  return { all, specsDir, path: specPath };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    if (!(await directoryExists(args.specsDir))) {
      console.error(`Error: Specs directory not found: ${args.specsDir}`);
      return 1;
    }

    const specs = await findSpecFiles(args.specsDir);
    const allErrors: ValidationError[] = [];

    for (const spec of specs) {
      const errors = await validateSpec(spec.path);
      allErrors.push(...errors);
    }

    if (allErrors.length > 0) {
      console.log('Validation errors:');
      for (const error of allErrors) {
        console.log(`  - ${error.file}: ${error.message}`);
      }
      return 1;
    }

    console.log(`✓ All ${specs.length} specs are valid`);
    return 0;
  }

  if (args.path) {
    const errors = await validateSpec(args.path);
    if (errors.length > 0) {
      console.log('Validation errors:');
      for (const error of errors) {
        console.log(`  - ${error.message}`);
      }
      return 1;
    }
    console.log(`✓ ${args.path} is valid`);
    return 0;
  }

  console.log('Usage: validate-spec.ts <path-to-spec.md>');
  console.log('       validate-spec.ts --all --specs-dir specs/');
  return 1;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
