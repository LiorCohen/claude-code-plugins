/**
 * Database Component Template Tests
 *
 * WHY: Validates that all template files for the database component exist
 * and contain the required content. Templates are the source of truth for
 * what gets generated during scaffolding.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, isDirectory, readFile } from '../../../lib';

const DATABASE_TEMPLATES_DIR = joinPath(SKILLS_DIR, 'database-scaffolding', 'templates');

/**
 * WHY: The package.json template defines how the database component is
 * configured as an npm package. Errors here break npm install/build.
 */
describe('Database package.json Template', () => {
  /**
   * WHY: package.json is required for npm to recognize the component.
   * Without it, npm install fails in the database component directory.
   */
  it('package.json template exists', () => {
    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
    expect(fileExists(packageJson)).toBe(true);
  });

  /**
   * WHY: Database management requires standard npm scripts for migrations,
   * seeding, and reset operations. Missing scripts force manual operations.
   */
  it('package.json defines migrate, seed, and reset scripts', () => {
    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = JSON.parse(readFile(packageJson)) as {
      scripts?: Record<string, string>;
    };

    expect(content.scripts).toBeDefined();
    expect(content.scripts?.['migrate']).toBeDefined();
    expect(content.scripts?.['seed']).toBeDefined();
    expect(content.scripts?.['reset']).toBeDefined();
  });

  /**
   * WHY: The {{PROJECT_NAME}} variable gets substituted during scaffolding.
   * Without it, all projects would have the same package name, causing conflicts.
   */
  it('package.json uses {{PROJECT_NAME}} variable', () => {
    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = readFile(packageJson);
    expect(content).toContain('{{PROJECT_NAME}}');
  });
});

/**
 * WHY: README.md provides documentation for the generated component.
 * Users need to know how to run migrations, seeds, and other operations.
 */
describe('Database README.md Template', () => {
  /**
   * WHY: Every component needs documentation. Without README, users
   * don't know how to use the generated database component.
   */
  it('README.md template exists', () => {
    const readme = joinPath(DATABASE_TEMPLATES_DIR, 'README.md');
    expect(fileExists(readme)).toBe(true);
  });

  /**
   * WHY: The README must document the npm run commands so users know
   * how to perform database operations without reading the code.
   */
  it('README.md documents npm run commands', () => {
    const readme = joinPath(DATABASE_TEMPLATES_DIR, 'README.md');
    const content = readFile(readme);

    expect(content).toContain('npm run migrate');
    expect(content).toContain('npm run seed');
    expect(content).toContain('npm run reset');
  });
});

/**
 * WHY: Migrations directory and initial migration are required for
 * database schema management. This is the core of the database component.
 */
describe('Database Migrations Templates', () => {
  /**
   * WHY: The migrations directory is where all schema changes live.
   * Without it, there's no place to put migration files.
   */
  it('migrations directory exists with initial migration', () => {
    const migrationsDir = joinPath(DATABASE_TEMPLATES_DIR, 'migrations');
    expect(fileExists(migrationsDir)).toBe(true);
    expect(isDirectory(migrationsDir)).toBe(true);

    const initialMigration = joinPath(migrationsDir, '001_initial_schema.sql');
    expect(fileExists(initialMigration)).toBe(true);
  });

  /**
   * WHY: BEGIN/COMMIT ensures migrations are atomic. If a migration
   * fails partway through, BEGIN/COMMIT prevents partial schema changes
   * that leave the database in an inconsistent state.
   */
  it('initial migration uses BEGIN/COMMIT for transaction safety', () => {
    const initialMigration = joinPath(
      DATABASE_TEMPLATES_DIR,
      'migrations',
      '001_initial_schema.sql'
    );
    const content = readFile(initialMigration);

    expect(content).toContain('BEGIN;');
    expect(content).toContain('COMMIT;');
  });
});

/**
 * WHY: Seeds provide initial/test data for development and testing.
 * Without seeds, developers must manually insert data every time.
 */
describe('Database Seeds Templates', () => {
  /**
   * WHY: The seeds directory holds data insertion scripts.
   * Without it, there's no standard location for seed files.
   */
  it('seeds directory exists with initial seed file', () => {
    const seedsDir = joinPath(DATABASE_TEMPLATES_DIR, 'seeds');
    expect(fileExists(seedsDir)).toBe(true);
    expect(isDirectory(seedsDir)).toBe(true);

    const initialSeed = joinPath(seedsDir, '001_seed_data.sql');
    expect(fileExists(initialSeed)).toBe(true);
  });

  /**
   * WHY: ON CONFLICT makes seeds idempotent - running them multiple times
   * won't fail or create duplicate data. This is essential for development
   * workflows where seeds are run repeatedly.
   */
  it('initial seed mentions ON CONFLICT for idempotency', () => {
    const initialSeed = joinPath(DATABASE_TEMPLATES_DIR, 'seeds', '001_seed_data.sql');
    const content = readFile(initialSeed);
    expect(content).toContain('ON CONFLICT');
  });
});

/**
 * WHY: Shell scripts provide the actual implementation of npm run commands.
 * They handle database connections and execute SQL files.
 */
describe('Database Scripts Templates', () => {
  /**
   * WHY: Each npm script (migrate, seed, reset) needs a corresponding
   * shell script. Missing scripts break the npm run commands.
   */
  it('scripts directory exists with all management scripts', () => {
    const scriptsDir = joinPath(DATABASE_TEMPLATES_DIR, 'scripts');
    expect(fileExists(scriptsDir)).toBe(true);
    expect(isDirectory(scriptsDir)).toBe(true);

    expect(fileExists(joinPath(scriptsDir, 'migrate.sh'))).toBe(true);
    expect(fileExists(joinPath(scriptsDir, 'seed.sh'))).toBe(true);
    expect(fileExists(joinPath(scriptsDir, 'reset.sh'))).toBe(true);
  });

  /**
   * WHY: Proper shebang (#!/bin/bash) ensures scripts run in bash.
   * set -e makes scripts fail on first error, preventing silent failures.
   */
  it('migrate.sh has proper shebang and set -e', () => {
    const migrateScript = joinPath(DATABASE_TEMPLATES_DIR, 'scripts', 'migrate.sh');
    const content = readFile(migrateScript);

    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -e');
  });

  /**
   * WHY: Same requirements as migrate.sh - proper execution environment
   * and fail-fast behavior for reliable operations.
   */
  it('seed.sh has proper shebang and set -e', () => {
    const seedScript = joinPath(DATABASE_TEMPLATES_DIR, 'scripts', 'seed.sh');
    const content = readFile(seedScript);

    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -e');
  });

  /**
   * WHY: reset.sh is destructive - it drops and recreates the database.
   * A safety prompt prevents accidental data loss in production.
   */
  it('reset.sh has a safety confirmation prompt', () => {
    const resetScript = joinPath(DATABASE_TEMPLATES_DIR, 'scripts', 'reset.sh');
    const content = readFile(resetScript);

    expect(content.includes('WARNING') || content.includes('Are you sure')).toBe(true);
  });
});
