/**
 * Test: /sdd-init command
 * Verifies that sdd-init creates the expected project structure.
 */

import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  projectFileContains,
  type TestProject,
  PROMPTS_DIR,
} from '../test-helpers.js';

describe('sdd-init command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-init-fullstack');
  });

  it('creates fullstack project structure', async () => {
    const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'sdd-init-fullstack.txt'), 'utf-8');

    console.log(`\nTest directory: ${testProject.path}\n`);
    console.log('Running /sdd-init...');

    const result = await runClaude(prompt, testProject.path, 300);

    // Save output for debugging
    await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying project structure...\n');

    // sdd-init creates a subdirectory with the project name
    const projectSubdir = path.join(testProject.path, 'test-fullstack-project');
    let project: TestProject;

    try {
      const stat = await fsp.stat(projectSubdir);
      if (stat.isDirectory()) {
        console.log(`Project created in subdirectory: ${projectSubdir}`);
        project = { path: projectSubdir, name: 'test-fullstack-project' };
      } else {
        project = testProject;
      }
    } catch {
      console.log(`Using test directory directly: ${testProject.path}`);
      project = testProject;
    }

    // Verify directory structure
    expect(projectIsDir(project, 'specs')).toBe(true);
    expect(projectIsDir(project, 'specs', 'domain')).toBe(true);
    expect(projectIsDir(project, 'specs', 'changes')).toBe(true);
    expect(projectIsDir(project, 'components')).toBe(true);
    expect(projectIsDir(project, 'components', 'config')).toBe(true);
    expect(projectIsDir(project, 'components', 'config', 'schemas')).toBe(true);
    expect(projectIsDir(project, 'components', 'contract')).toBe(true);
    expect(projectIsDir(project, 'components', 'server')).toBe(true);
    expect(projectIsDir(project, 'components', 'server', 'src', 'operator')).toBe(true);
    expect(projectIsDir(project, 'components', 'webapp')).toBe(true);

    // Verify key files exist
    expect(projectIsFile(project, 'README.md')).toBe(true);
    expect(projectIsFile(project, 'CLAUDE.md')).toBe(true);
    expect(projectIsFile(project, 'package.json')).toBe(true);
    expect(projectIsFile(project, 'specs', 'INDEX.md')).toBe(true);
    expect(projectIsFile(project, 'specs', 'domain', 'glossary.md')).toBe(true);

    // Verify config component
    expect(projectIsFile(project, 'components', 'config', 'config.yaml')).toBe(true);
    expect(projectIsFile(project, 'components', 'config', 'schemas', 'schema.json')).toBe(true);

    // Verify server component
    expect(projectIsFile(project, 'components', 'server', 'package.json')).toBe(true);
    expect(projectIsFile(project, 'components', 'server', 'src', 'operator', 'create_operator.ts')).toBe(
      true
    );
    expect(projectIsFile(project, 'components', 'server', 'src', 'index.ts')).toBe(true);

    // Verify webapp component
    expect(projectIsFile(project, 'components', 'webapp', 'package.json')).toBe(true);
    expect(projectIsFile(project, 'components', 'webapp', 'index.html')).toBe(true);
    expect(projectIsFile(project, 'components', 'webapp', 'vite.config.ts')).toBe(true);

    // Verify contract component
    expect(projectIsFile(project, 'components', 'contract', 'openapi.yaml')).toBe(true);

    // Verify project name substitution
    expect(projectFileContains(project, 'package.json', 'test-fullstack-project')).toBe(true);

    console.log('\nAll assertions passed!');
  }, 360000); // 6 minute timeout
});
