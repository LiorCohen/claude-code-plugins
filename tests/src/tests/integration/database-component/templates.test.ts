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
 * WHY: Database operations are now handled by the sdd-system CLI.
 * The package.json scripts call CLI commands instead of shell scripts.
 * This provides type-safe, testable implementations.
 */
describe('Database CLI Integration', () => {
  /**
   * WHY: package.json scripts should use sdd-system CLI commands
   * instead of local shell scripts for better maintainability.
   */
  it('package.json uses sdd-system CLI commands', () => {
    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = readFile(packageJson);

    expect(content).toContain('sdd-system database setup');
    expect(content).toContain('sdd-system database migrate');
    expect(content).toContain('sdd-system database seed');
    expect(content).toContain('sdd-system database reset');
    expect(content).toContain('sdd-system database teardown');
  });

  /**
   * WHY: The CLI commands should use {{COMPONENT_NAME}} variable
   * so each database component can be managed independently.
   */
  it('package.json uses {{COMPONENT_NAME}} variable for CLI commands', () => {
    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = readFile(packageJson);

    expect(content).toContain('{{COMPONENT_NAME}}');
  });
});
