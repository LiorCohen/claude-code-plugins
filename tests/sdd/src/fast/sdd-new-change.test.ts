/**
 * Test: /sdd-new-change command
 * Verifies that spec-writer and planner agents are invoked correctly.
 */

import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  agentWasUsed,
  agentOrder,
  projectFindDir,
  type TestProject,
  PROMPTS_DIR,
} from '../test-helpers.js';

describe('sdd-new-change command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-new-change');

    // Create minimal project structure that /sdd-new-change expects
    await fsp.mkdir(path.join(testProject.path, 'specs', 'changes'), { recursive: true });
    await fsp.mkdir(path.join(testProject.path, 'specs', 'domain'), { recursive: true });
    await fsp.mkdir(path.join(testProject.path, 'components', 'contract'), { recursive: true });

    // Create minimal glossary
    await fsp.writeFile(
      path.join(testProject.path, 'specs', 'domain', 'glossary.md'),
      `# Glossary

## Domains

### Core
The primary business domain.

## Terms

(No terms defined yet)
`
    );

    // Create minimal INDEX.md
    await fsp.writeFile(
      path.join(testProject.path, 'specs', 'INDEX.md'),
      `# Specifications Index

## Active Changes

(No changes yet)
`
    );
  });

  it('invokes spec-writer and planner agents', async () => {
    const prompt = await fsp.readFile(path.join(PROMPTS_DIR, 'sdd-new-change.txt'), 'utf-8');

    console.log(`\nTest project directory: ${testProject.path}\n`);
    console.log('Created minimal project structure\n');
    console.log('Running /sdd-new-change...');

    const result = await runClaude(prompt, testProject.path, 300);

    // Save output for debugging
    await fsp.writeFile(path.join(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying agent invocations...\n');

    // Verify agents were used
    expect(agentWasUsed(result, 'spec-writer')).toBe(true);
    expect(agentWasUsed(result, 'planner')).toBe(true);

    // Verify agent order (spec-writer should come before planner)
    expect(agentOrder(result, 'spec-writer', 'planner')).toBe(true);

    console.log('\nVerifying generated files...\n');

    // Find the generated spec directory
    const specDir = projectFindDir(testProject, 'user-auth');

    expect(specDir).not.toBeNull();
    console.log(`Found spec directory: ${specDir}`);

    // Verify SPEC.md exists and has correct content
    const specFile = path.join(specDir!, 'SPEC.md');
    const specExists = await fsp
      .stat(specFile)
      .then((s) => s.isFile())
      .catch(() => false);
    expect(specExists).toBe(true);

    const specContent = await fsp.readFile(specFile, 'utf-8');
    expect(specContent).toContain('sdd_version:');
    expect(specContent).toContain('issue:');
    expect(specContent).toContain('type:');

    // Verify PLAN.md exists and has correct content
    const planFile = path.join(specDir!, 'PLAN.md');
    const planExists = await fsp
      .stat(planFile)
      .then((s) => s.isFile())
      .catch(() => false);
    expect(planExists).toBe(true);

    const planContent = await fsp.readFile(planFile, 'utf-8');
    expect(planContent).toContain('sdd_version:');

    console.log('\nAll assertions passed!');
  }, 360000); // 6 minute timeout
});
