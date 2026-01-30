/**
 * Database seed command.
 *
 * Run database seed files.
 *
 * Usage:
 *   sdd-system database seed <component-name>
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import type { CommandResult } from '../../lib/args.js';
import { parseNamedArgs } from '../../lib/args.js';
import { exists, walkDir } from '../../lib/fs.js';
import { findProjectRoot } from '../../lib/config.js';

export const seed = async (
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
  const seedsDir = path.join(componentDir, 'seeds');

  if (!(await exists(seedsDir))) {
    return {
      success: false,
      error: `Seeds directory not found: ${seedsDir}`,
    };
  }

  // Default connection settings (assumes port-forward is running)
  const pgHost = named['host'] ?? process.env['PGHOST'] ?? 'localhost';
  const pgPort = named['port'] ?? process.env['PGPORT'] ?? '5432';
  const pgDatabase = named['database'] ?? process.env['PGDATABASE'] ?? componentName;
  const pgUser = named['user'] ?? process.env['PGUSER'] ?? componentName;
  const pgPassword = named['password'] ?? process.env['PGPASSWORD'] ?? `${componentName}-local`;

  // Set environment for psql
  const env = {
    ...process.env,
    PGHOST: pgHost,
    PGPORT: pgPort,
    PGDATABASE: pgDatabase,
    PGUSER: pgUser,
    PGPASSWORD: pgPassword,
  };

  // Verify PostgreSQL connection
  try {
    execSync('psql -c "SELECT 1"', { stdio: 'pipe', env });
  } catch {
    return {
      success: false,
      error: `Cannot connect to PostgreSQL at ${pgHost}:${pgPort}. Make sure port-forward is running: sdd-system database port-forward ${componentName}`,
    };
  }

  // Find all seed files
  const seedFiles = [...(await walkDir(seedsDir, (entry) => entry.name.endsWith('.sql')))].sort();

  if (seedFiles.length === 0) {
    console.log('No seed files found');
    return {
      success: true,
      message: 'No seed files found',
      data: { seedsRun: 0 },
    };
  }

  console.log('Running seeds...');
  const seedsRun: string[] = [];

  try {
    for (const seedFile of seedFiles) {
      const fileName = path.basename(seedFile);
      console.log(`  ${fileName}`);
      execSync(`psql -f "${seedFile}"`, { stdio: 'inherit', env });
      seedsRun.push(fileName);
    }

    console.log('');
    console.log('Seeding complete');

    return {
      success: true,
      message: `Ran ${seedsRun.length} seed files`,
      data: { seedsRun },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Seeding failed: ${errorMessage}`,
      data: { seedsRun },
    };
  }
};
