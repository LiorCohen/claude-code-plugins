/**
 * Test: Database Component Type
 * Verifies that the database component scaffolding works correctly.
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PLUGIN_DIR, SKILLS_DIR } from '../test-helpers.js';

// Paths
const DATABASE_SKILL_DIR = path.join(SKILLS_DIR, 'database-scaffolding');
const DATABASE_TEMPLATES_DIR = path.join(DATABASE_SKILL_DIR, 'templates');
const SCAFFOLDING_SCRIPT = path.join(SKILLS_DIR, 'scaffolding', 'scaffolding.ts');

/**
 * Run the scaffolding script with ts-node.
 */
const runScaffolding = async (
  configPath: string,
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const process = spawn(
      'npx',
      ['ts-node', '--esm', SCAFFOLDING_SCRIPT, '--config', configPath],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });

    process.on('error', reject);
  });
};

describe('TestDatabaseSkillStructure', () => {
  it('skill directory should exist', () => {
    expect(fs.existsSync(DATABASE_SKILL_DIR)).toBe(true);
    expect(fs.statSync(DATABASE_SKILL_DIR).isDirectory()).toBe(true);
  });

  it('SKILL.md should exist', () => {
    const skillMd = path.join(DATABASE_SKILL_DIR, 'SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });

  it('SKILL.md should have required frontmatter fields', () => {
    const skillMd = path.join(DATABASE_SKILL_DIR, 'SKILL.md');
    const content = fs.readFileSync(skillMd, 'utf-8');

    expect(content).toContain('---');
    expect(content).toContain('name: database-scaffolding');
    expect(content).toContain('description:');
  });

  it('templates directory should exist', () => {
    expect(fs.existsSync(DATABASE_TEMPLATES_DIR)).toBe(true);
    expect(fs.statSync(DATABASE_TEMPLATES_DIR).isDirectory()).toBe(true);
  });
});

describe('TestDatabaseTemplates', () => {
  it('package.json template should exist', () => {
    const packageJson = path.join(DATABASE_TEMPLATES_DIR, 'package.json');
    expect(fs.existsSync(packageJson)).toBe(true);
  });

  it('package.json should define migrate, seed, and reset scripts', () => {
    const packageJson = path.join(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8')) as {
      scripts?: Record<string, string>;
    };

    expect(content.scripts).toBeDefined();
    expect(content.scripts?.['migrate']).toBeDefined();
    expect(content.scripts?.['seed']).toBeDefined();
    expect(content.scripts?.['reset']).toBeDefined();
  });

  it('package.json should use {{PROJECT_NAME}} variable', () => {
    const packageJson = path.join(DATABASE_TEMPLATES_DIR, 'package.json');
    const content = fs.readFileSync(packageJson, 'utf-8');
    expect(content).toContain('{{PROJECT_NAME}}');
  });

  it('README.md template should exist', () => {
    const readme = path.join(DATABASE_TEMPLATES_DIR, 'README.md');
    expect(fs.existsSync(readme)).toBe(true);
  });

  it('README.md should document npm run commands', () => {
    const readme = path.join(DATABASE_TEMPLATES_DIR, 'README.md');
    const content = fs.readFileSync(readme, 'utf-8');

    expect(content).toContain('npm run migrate');
    expect(content).toContain('npm run seed');
    expect(content).toContain('npm run reset');
  });

  it('migrations/ directory should exist with initial migration', () => {
    const migrationsDir = path.join(DATABASE_TEMPLATES_DIR, 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);
    expect(fs.statSync(migrationsDir).isDirectory()).toBe(true);

    const initialMigration = path.join(migrationsDir, '001_initial_schema.sql');
    expect(fs.existsSync(initialMigration)).toBe(true);
  });

  it('initial migration should use BEGIN/COMMIT for transaction safety', () => {
    const initialMigration = path.join(
      DATABASE_TEMPLATES_DIR,
      'migrations',
      '001_initial_schema.sql'
    );
    const content = fs.readFileSync(initialMigration, 'utf-8');

    expect(content).toContain('BEGIN;');
    expect(content).toContain('COMMIT;');
  });

  it('seeds/ directory should exist with initial seed file', () => {
    const seedsDir = path.join(DATABASE_TEMPLATES_DIR, 'seeds');
    expect(fs.existsSync(seedsDir)).toBe(true);
    expect(fs.statSync(seedsDir).isDirectory()).toBe(true);

    const initialSeed = path.join(seedsDir, '001_seed_data.sql');
    expect(fs.existsSync(initialSeed)).toBe(true);
  });

  it('initial seed should mention ON CONFLICT for idempotency', () => {
    const initialSeed = path.join(DATABASE_TEMPLATES_DIR, 'seeds', '001_seed_data.sql');
    const content = fs.readFileSync(initialSeed, 'utf-8');
    expect(content).toContain('ON CONFLICT');
  });

  it('scripts/ directory should exist with all management scripts', () => {
    const scriptsDir = path.join(DATABASE_TEMPLATES_DIR, 'scripts');
    expect(fs.existsSync(scriptsDir)).toBe(true);
    expect(fs.statSync(scriptsDir).isDirectory()).toBe(true);

    expect(fs.existsSync(path.join(scriptsDir, 'migrate.sh'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'seed.sh'))).toBe(true);
    expect(fs.existsSync(path.join(scriptsDir, 'reset.sh'))).toBe(true);
  });

  it('migrate.sh should have proper shebang', () => {
    const migrateScript = path.join(DATABASE_TEMPLATES_DIR, 'scripts', 'migrate.sh');
    const content = fs.readFileSync(migrateScript, 'utf-8');

    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -e');
  });

  it('seed.sh should have proper shebang', () => {
    const seedScript = path.join(DATABASE_TEMPLATES_DIR, 'scripts', 'seed.sh');
    const content = fs.readFileSync(seedScript, 'utf-8');

    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -e');
  });

  it('reset.sh should have a safety confirmation prompt', () => {
    const resetScript = path.join(DATABASE_TEMPLATES_DIR, 'scripts', 'reset.sh');
    const content = fs.readFileSync(resetScript, 'utf-8');

    expect(content.includes('WARNING') || content.includes('Are you sure')).toBe(true);
  });
});

describe('TestScaffoldingScript', () => {
  it('scaffolding.ts should reference database component', () => {
    const content = fs.readFileSync(SCAFFOLDING_SCRIPT, 'utf-8');

    expect(content).toContain('database');
    expect(content).toContain('database-scaffolding');
  });

  it('scaffolding.ts should create database directories', () => {
    const content = fs.readFileSync(SCAFFOLDING_SCRIPT, 'utf-8');

    expect(content).toContain('components/database');
    expect(content).toContain('components/database/migrations');
    expect(content).toContain('components/database/seeds');
    expect(content).toContain('components/database/scripts');
  });

  describe('scaffolding integration', () => {
    let tmpDir: string;

    beforeAll(async () => {
      tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'sdd-test-'));
    });

    afterAll(async () => {
      if (tmpDir) {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should create correct database structure', async () => {
      const targetDir = path.join(tmpDir, 'test-project');
      await fsp.mkdir(targetDir);

      const config = {
        project_name: 'test-project',
        project_description: 'Test project',
        primary_domain: 'Testing',
        target_dir: targetDir,
        components: ['database', 'config'],
        skills_dir: SKILLS_DIR,
      };

      const configFile = path.join(tmpDir, 'config.json');
      await fsp.writeFile(configFile, JSON.stringify(config));

      const result = await runScaffolding(configFile, tmpDir);

      expect(result.exitCode).toBe(0);

      // Verify database structure
      const dbDir = path.join(targetDir, 'components', 'database');
      expect(fs.existsSync(dbDir)).toBe(true);
      expect(fs.existsSync(path.join(dbDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(dbDir, 'README.md'))).toBe(true);
      expect(fs.statSync(path.join(dbDir, 'migrations')).isDirectory()).toBe(true);
      expect(fs.statSync(path.join(dbDir, 'seeds')).isDirectory()).toBe(true);
      expect(fs.statSync(path.join(dbDir, 'scripts')).isDirectory()).toBe(true);
      expect(fs.existsSync(path.join(dbDir, 'scripts', 'migrate.sh'))).toBe(true);
      expect(fs.existsSync(path.join(dbDir, 'scripts', 'seed.sh'))).toBe(true);
      expect(fs.existsSync(path.join(dbDir, 'scripts', 'reset.sh'))).toBe(true);
    });

    it('should substitute {{PROJECT_NAME}} in templates', async () => {
      const targetDir = path.join(tmpDir, 'my-app');
      await fsp.mkdir(targetDir);

      const config = {
        project_name: 'my-app',
        project_description: 'My application',
        primary_domain: 'Testing',
        target_dir: targetDir,
        components: ['database', 'config'],
        skills_dir: SKILLS_DIR,
      };

      const configFile = path.join(tmpDir, 'config2.json');
      await fsp.writeFile(configFile, JSON.stringify(config));

      const result = await runScaffolding(configFile, tmpDir);

      expect(result.exitCode).toBe(0);

      // Check variable substitution
      const packageJson = path.join(targetDir, 'components', 'database', 'package.json');
      const content = await fsp.readFile(packageJson, 'utf-8');

      expect(content).toContain('my-app-database');
      expect(content).not.toContain('{{PROJECT_NAME}}');
    });
  });
});

describe('TestDocumentationConsistency', () => {
  it('scaffolding SKILL.md should list database component', () => {
    const skillMd = path.join(SKILLS_DIR, 'scaffolding', 'SKILL.md');
    const content = fs.readFileSync(skillMd, 'utf-8');

    expect(content.toLowerCase()).toContain('database');
    expect(content).toContain('database-scaffolding');
  });

  it('project-settings SKILL.md should include database in schema', () => {
    const skillMd = path.join(SKILLS_DIR, 'project-settings', 'SKILL.md');
    const content = fs.readFileSync(skillMd, 'utf-8');

    expect(content).toContain('database:');
    expect(content.includes('database: true') || content.includes('database: false')).toBe(true);
  });

  it('sdd-init command should include database option', () => {
    const commandMd = path.join(PLUGIN_DIR, 'commands', 'sdd-init.md');
    const content = fs.readFileSync(commandMd, 'utf-8');

    expect(content).toContain('Database');
    expect(content).toContain('Backend with Database');
  });

  it('planner agent should know about database', () => {
    const agentMd = path.join(PLUGIN_DIR, 'agents', 'planner.md');
    const content = fs.readFileSync(agentMd, 'utf-8');

    expect(content).toContain('Database');
    expect(content).toContain('components/database');
  });

  it('README should show database in structure', () => {
    const readme = path.join(PLUGIN_DIR, 'README.md');
    const content = fs.readFileSync(readme, 'utf-8');

    expect(content).toContain('database/');
  });
});

describe('TestBackendDevIntegration', () => {
  it('backend-dev.md should reference the database component', () => {
    const agentMd = path.join(PLUGIN_DIR, 'agents', 'backend-dev.md');
    const content = fs.readFileSync(agentMd, 'utf-8');

    expect(content).toContain('components/database');
    expect(content).toContain('migrations/');
    expect(content).toContain('seeds/');
  });

  it('backend-dev.md should reference postgresql skill', () => {
    const agentMd = path.join(PLUGIN_DIR, 'agents', 'backend-dev.md');
    const content = fs.readFileSync(agentMd, 'utf-8');

    expect(content.toLowerCase()).toContain('postgresql');
  });
});

describe('TestDevopsIntegration', () => {
  it('devops.md should reference database component', () => {
    const agentMd = path.join(PLUGIN_DIR, 'agents', 'devops.md');
    const content = fs.readFileSync(agentMd, 'utf-8');

    expect(content.toLowerCase()).toContain('database');
    expect(content).toContain('components/database');
  });

  it('devops.md should mention database deployment strategies', () => {
    const agentMd = path.join(PLUGIN_DIR, 'agents', 'devops.md');
    const content = fs.readFileSync(agentMd, 'utf-8');

    const hasDeploymentPattern =
      content.includes('StatefulSet') ||
      content.toLowerCase().includes('migrations') ||
      content.includes('PostgreSQL');

    expect(hasDeploymentPattern).toBe(true);
  });
});
