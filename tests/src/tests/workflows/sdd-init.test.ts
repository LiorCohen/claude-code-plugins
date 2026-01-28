/**
 * Workflow Test: /sdd-init command
 *
 * WHY: Verifies that sdd-init creates the expected project structure.
 * This is a workflow test that runs Claude with a predefined prompt
 * and validates the generated output deterministically.
 *
 * Token usage is recorded to tests/data/sdd-init.yaml for benchmarking.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  projectFileContains,
  writeFileAsync,
  joinPath,
  statAsync,
  recordBenchmark,
  getTestFilePath,
  type TestProject,
} from '../../lib';

const TEST_FILE = getTestFilePath(import.meta.url.replace('file://', ''));

const FULLSTACK_PROMPT = `Run /sdd-init --name test-fullstack-project to create a new project.

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- Skip Phase 0-1: Use project name "test-fullstack-project"
- Skip Phase 1: Product = "Test Suite Manager", Domain = "Testing", Users = Testers and Admins, Entities = TestSuite, TestCase, TestResult
- Skip Phase 2-3: Use fullstack components (contract, server, webapp)
- Skip Phase 4: Consider PRE-APPROVED
- Execute Phase 5: Create all files using the scaffolding skill

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Create subdirectory: ./test-fullstack-project/
4. Work in CURRENT WORKING DIRECTORY only - no absolute paths
5. Create ALL required files for a fullstack project
6. Complete the entire workflow without stopping`;

/**
 * WHY: sdd-init is the primary entry point for new projects. If it doesn't
 * create the correct structure, all subsequent development is broken.
 */
describe('sdd-init command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-init-fullstack');
  });

  /**
   * WHY: This test validates that sdd-init creates a complete, functional
   * project structure. Missing directories or files would break the SDD
   * workflow for users attempting to start new projects.
   */
  it('creates fullstack project structure', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);
    console.log('Running /sdd-init...');

    // sdd-init creates many files via scaffolding - needs extended timeout
    const result = await runClaude(FULLSTACK_PROMPT, testProject.path, 420);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying project structure...\n');

    // sdd-init creates a subdirectory with the project name
    const projectSubdir = joinPath(testProject.path, 'test-fullstack-project');
    let project: TestProject;

    const stat = await statAsync(projectSubdir);
    if (stat?.isDirectory()) {
      console.log(`Project created in subdirectory: ${projectSubdir}`);
      project = { path: projectSubdir, name: 'test-fullstack-project' };
    } else {
      console.log(`Using test directory directly: ${testProject.path}`);
      project = testProject;
    }

    // Verify directory structure
    expect(projectIsDir(project, 'specs')).toBe(true);
    expect(projectIsDir(project, 'specs', 'domain')).toBe(true);
    expect(projectIsDir(project, 'specs', 'changes')).toBe(true);
    expect(projectIsDir(project, 'components')).toBe(true);
    expect(projectIsDir(project, 'config')).toBe(true);
    expect(projectIsDir(project, 'config', 'schemas')).toBe(true);
    expect(projectIsDir(project, 'components', 'server')).toBe(true);
    expect(projectIsDir(project, 'components', 'server', 'src', 'operator')).toBe(true);
    expect(projectIsDir(project, 'components', 'webapp')).toBe(true);

    // Verify key files exist
    expect(projectIsFile(project, 'README.md')).toBe(true);
    expect(projectIsFile(project, 'CLAUDE.md')).toBe(true);
    expect(projectIsFile(project, 'package.json')).toBe(true);
    expect(projectIsFile(project, 'specs', 'INDEX.md')).toBe(true);
    expect(projectIsFile(project, 'specs', 'domain', 'glossary.md')).toBe(true);

    // Verify config directory (at project root, not a component)
    expect(projectIsFile(project, 'config', 'config.yaml')).toBe(true);
    expect(projectIsFile(project, 'config', 'schemas', 'schema.json')).toBe(true);

    // Verify server component
    expect(projectIsFile(project, 'components', 'server', 'package.json')).toBe(true);
    expect(
      projectIsFile(project, 'components', 'server', 'src', 'operator', 'create_operator.ts')
    ).toBe(true);
    expect(projectIsFile(project, 'components', 'server', 'src', 'index.ts')).toBe(true);

    // Verify webapp component
    expect(projectIsFile(project, 'components', 'webapp', 'package.json')).toBe(true);
    expect(projectIsFile(project, 'components', 'webapp', 'index.html')).toBe(true);
    expect(projectIsFile(project, 'components', 'webapp', 'vite.config.ts')).toBe(true);

    // Verify contract component
    expect(projectIsFile(project, 'components', 'contract', 'openapi.yaml')).toBe(true);

    // Verify project name substitution
    expect(projectFileContains(project, 'package.json', 'test-fullstack-project')).toBe(true);

    // Record token usage benchmark
    const benchmark = await recordBenchmark('sdd-init', TEST_FILE, 'init-fullstack', result.output);
    console.log(`\nToken usage recorded:`);
    console.log(`  Total: ${benchmark.total.total_tokens} tokens`);
    console.log(`  Input: ${benchmark.total.input_tokens}, Output: ${benchmark.total.output_tokens}`);
    console.log(`  Turns: ${benchmark.turn_count}`);

    console.log('\nAll assertions passed!');
  }, 480000); // 8 minute timeout for complex scaffolding
});
