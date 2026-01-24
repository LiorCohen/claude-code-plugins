/**
 * Test: PostgreSQL Skill - Real Usage Scenarios
 * Tests actual PostgreSQL operations using Docker containers.
 *
 * These tests verify Claude can use the postgresql skill to:
 * - Deploy PostgreSQL via Docker
 * - Create and manage database schemas
 * - Set up users and permissions
 * - Seed data
 * - Run queries and analyze performance
 * - Create migration plans
 */

import { spawn } from 'node:child_process';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestProject, runClaude, type TestProject, PROMPTS_DIR } from '../test-helpers.js';

// Container name for tests
const PG_CONTAINER = 'sdd-postgres-test';
const PG_USER = 'testuser';
const PG_PASSWORD = 'testpass';
const PG_DATABASE = 'testdb';
const PG_PORT = 5433; // Use non-standard port to avoid conflicts

/**
 * Run a command and return the result.
 */
const runCommand = async (
  cmd: string,
  args: readonly string[],
  options: { timeout?: number; input?: string } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const timeout = options.timeout ?? 30000;
    const timeoutId = setTimeout(() => {
      proc.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    if (options.input) {
      proc.stdin?.write(options.input);
      proc.stdin?.end();
    }

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

/**
 * Check if Docker is available.
 */
const dockerAvailable = async (): Promise<boolean> => {
  try {
    const result = await runCommand('docker', ['info'], { timeout: 10000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
};

/**
 * Start a PostgreSQL container for testing.
 */
const startPostgresContainer = async (): Promise<boolean> => {
  // Remove existing container if present
  await runCommand('docker', ['rm', '-f', PG_CONTAINER]).catch(() => {});

  // Start new container
  const result = await runCommand('docker', [
    'run',
    '-d',
    '--name',
    PG_CONTAINER,
    '-e',
    `POSTGRES_USER=${PG_USER}`,
    '-e',
    `POSTGRES_PASSWORD=${PG_PASSWORD}`,
    '-e',
    `POSTGRES_DB=${PG_DATABASE}`,
    '-p',
    `${PG_PORT}:5432`,
    'postgres:16',
  ]);

  if (result.exitCode !== 0) {
    console.log(`Failed to start container: ${result.stderr}`);
    return false;
  }

  // Wait for PostgreSQL to be ready
  for (let i = 0; i < 30; i++) {
    const check = await runCommand('docker', [
      'exec',
      PG_CONTAINER,
      'pg_isready',
      '-U',
      PG_USER,
      '-d',
      PG_DATABASE,
    ]);
    if (check.exitCode === 0) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  return false;
};

/**
 * Stop and remove the PostgreSQL container.
 */
const stopPostgresContainer = async (): Promise<void> => {
  await runCommand('docker', ['rm', '-f', PG_CONTAINER]).catch(() => {});
};

/**
 * Run SQL against the test PostgreSQL container.
 */
const runPsql = async (sql: string): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  return runCommand('docker', ['exec', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE, '-c', sql]);
};

/**
 * Run a SQL file against the test PostgreSQL container.
 */
const runPsqlFile = async (
  filepath: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  const sql = await fsp.readFile(filepath, 'utf-8');
  return runCommand(
    'docker',
    ['exec', '-i', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE],
    { input: sql, timeout: 60000 }
  );
};

/**
 * Find SQL files recursively in a directory.
 */
const findSqlFiles = async (dir: string): Promise<readonly string[]> => {
  const files: string[] = [];

  const walk = async (currentDir: string): Promise<void> => {
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.sql')) {
        files.push(fullPath);
      }
    }
  };

  await walk(dir);
  return files;
};

describe('PostgreSQL Skill Tests', () => {
  let dockerIsAvailable = false;

  beforeAll(async () => {
    dockerIsAvailable = await dockerAvailable();
  });

  describe('TestDeployPostgres', () => {
    let testProject: TestProject;

    beforeEach(async () => {
      testProject = await createTestProject('postgresql-deploy');
    });

    it('generates Docker deployment commands', async () => {
      const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'postgresql-deploy-docker.txt'), 'utf-8');

      const result = await runClaude(prompt, testProject.path, 180);
      await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

      expect(result.exitCode).toBe(0);

      // Check that deployment files were created
      const composeYml = path.join(testProject.path, 'docker-compose.yml');
      const composeYaml = path.join(testProject.path, 'docker-compose.yaml');

      const ymlExists = await fsp
        .stat(composeYml)
        .then(() => true)
        .catch(() => false);
      const yamlExists = await fsp
        .stat(composeYaml)
        .then(() => true)
        .catch(() => false);

      expect(ymlExists || yamlExists).toBe(true);

      // Verify docker-compose content
      const composeFile = ymlExists ? composeYml : composeYaml;
      const content = await fsp.readFile(composeFile, 'utf-8');
      expect(content.toLowerCase()).toContain('postgres');
      expect(content).toContain('5432');
      expect(content).toContain('POSTGRES_');
    }, 240000);
  });

  describe('TestCreateSchema', () => {
    let testProject: TestProject;

    beforeAll(async () => {
      if (!dockerIsAvailable) return;
      await startPostgresContainer();
    });

    afterAll(async () => {
      if (dockerIsAvailable) {
        await stopPostgresContainer();
      }
    });

    beforeEach(async () => {
      testProject = await createTestProject('postgresql-schema');
    });

    it.skipIf(!dockerIsAvailable)('creates users table with proper constraints', async () => {
      const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'postgresql-create-schema.txt'), 'utf-8');

      const result = await runClaude(prompt, testProject.path, 180);
      await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

      expect(result.exitCode).toBe(0);

      // Find the generated SQL file
      const sqlFiles = await findSqlFiles(testProject.path);
      expect(sqlFiles.length).toBeGreaterThan(0);

      // Execute the SQL
      for (const sqlFile of sqlFiles) {
        if (
          sqlFile.toLowerCase().includes('schema') ||
          sqlFile.toLowerCase().includes('create')
        ) {
          const execResult = await runPsqlFile(sqlFile);
          expect(execResult.exitCode).toBe(0);
        }
      }

      // Verify table was created
      const tableCheck = await runPsql(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';"
      );
      expect(tableCheck.stdout).toContain('users');

      // Verify constraints exist
      const constraintCheck = await runPsql(
        "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users';"
      );
      expect(
        constraintCheck.stdout.toLowerCase().includes('pkey') ||
          constraintCheck.stdout.toLowerCase().includes('primary')
      ).toBe(true);
    }, 240000);
  });

  describe('TestSeedData', () => {
    let testProject: TestProject;

    beforeAll(async () => {
      if (!dockerIsAvailable) return;
      await startPostgresContainer();

      // Ensure users table exists
      await runPsql(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    });

    afterAll(async () => {
      if (dockerIsAvailable) {
        await stopPostgresContainer();
      }
    });

    beforeEach(async () => {
      testProject = await createTestProject('postgresql-seed');
    });

    it.skipIf(!dockerIsAvailable)('seeds users data', async () => {
      const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'postgresql-seed-data.txt'), 'utf-8');

      const result = await runClaude(prompt, testProject.path, 180);
      await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

      expect(result.exitCode).toBe(0);

      // Find and execute seed SQL
      const sqlFiles = await findSqlFiles(testProject.path);
      for (const sqlFile of sqlFiles) {
        if (
          sqlFile.toLowerCase().includes('seed') ||
          sqlFile.toLowerCase().includes('data')
        ) {
          const execResult = await runPsqlFile(sqlFile);
          expect(execResult.exitCode).toBe(0);
        }
      }

      // Verify data was inserted
      const countResult = await runPsql('SELECT COUNT(*) FROM users;');
      expect(countResult.exitCode).toBe(0);

      const lines = countResult.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d+$/.test(l));
      if (lines.length > 0) {
        const count = parseInt(lines[0]!, 10);
        expect(count).toBeGreaterThan(0);
      }
    }, 240000);
  });

  describe('TestMigrationPlan', () => {
    let testProject: TestProject;

    beforeAll(async () => {
      if (!dockerIsAvailable) return;
      await startPostgresContainer();

      // Ensure users table exists
      await runPsql(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    });

    afterAll(async () => {
      if (dockerIsAvailable) {
        await stopPostgresContainer();
      }
    });

    beforeEach(async () => {
      testProject = await createTestProject('postgresql-migration');
      await fsp.mkdir(path.join(testProject.path, 'db', 'migrations'), { recursive: true });
      await fsp.mkdir(path.join(testProject.path, 'db', 'seeds'), { recursive: true });
    });

    it.skipIf(!dockerIsAvailable)('creates migration to add column', async () => {
      const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'postgresql-migration-plan.txt'), 'utf-8');

      const result = await runClaude(prompt, testProject.path, 180);
      await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

      expect(result.exitCode).toBe(0);

      // Find migration files
      let migrationFiles = await findSqlFiles(path.join(testProject.path, 'db', 'migrations'));
      if (migrationFiles.length === 0) {
        migrationFiles = (await findSqlFiles(testProject.path)).filter((f) =>
          f.toLowerCase().includes('migration')
        );
      }

      expect(migrationFiles.length).toBeGreaterThan(0);

      // Check migration content for safe patterns
      let migrationContent = '';
      for (const f of migrationFiles) {
        migrationContent += await fsp.readFile(f, 'utf-8');
      }
      expect(migrationContent).toContain('ALTER TABLE');

      // Execute migration
      for (const migFile of migrationFiles) {
        const execResult = await runPsqlFile(migFile);
        expect(execResult.exitCode).toBe(0);
      }

      // Verify column was added
      const columnCheck = await runPsql(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
      );
      expect(columnCheck.stdout).toContain('phone');
    }, 240000);
  });

  describe('TestBackupRestore', () => {
    let testProject: TestProject;

    beforeEach(async () => {
      testProject = await createTestProject('postgresql-backup');
    });

    it('generates backup commands', async () => {
      const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'postgresql-backup.txt'), 'utf-8');

      const result = await runClaude(prompt, testProject.path, 180);
      await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

      expect(result.exitCode).toBe(0);

      // Check that backup commands/scripts were created
      expect(result.output.toLowerCase()).toContain('pg_dump');

      // Check for script file
      const entries = await fsp.readdir(testProject.path, { withFileTypes: true });
      const hasBackupFile = entries.some(
        (e) => e.name.endsWith('.sh') || e.name.toLowerCase().includes('backup')
      );

      // Either a script was created or commands were provided in output
      expect(hasBackupFile || result.output.includes('pg_dump')).toBe(true);
    }, 240000);
  });
});
