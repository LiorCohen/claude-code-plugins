/**
 * Workflow Test: /sdd-new-change command
 *
 * WHY: Verifies that sdd-new-change correctly invokes the spec-writer and
 * planner agents in the right order. This ensures the SDD workflow produces
 * valid specifications and implementation plans.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  agentWasUsed,
  agentOrder,
  projectFindDir,
  writeFileAsync,
  mkdir,
  joinPath,
  statAsync,
  readFileAsync,
  type TestProject,
} from '../../lib';

const NEW_CHANGE_PROMPT = `Run /sdd-new-change --type feature --name user-auth to create a new change specification.

Change name: user-auth
Change type: feature
Issue reference: TEST-001
Domain: Core
Description: User authentication with email and password

When prompted, provide these answers:
- Change name: user-auth
- Type: feature
- Issue: TEST-001
- Domain: Core
- Description: Basic user authentication allowing users to sign up, log in, and log out using email and password credentials.

Proceed through the entire workflow:
1. Create the SPEC.md using the spec-writer agent
2. Create the PLAN.md using the planner agent

IMPORTANT:
- Do not ask any questions. Use the values provided above.
- You MUST use the spec-writer agent to create the spec.
- You MUST use the planner agent to create the plan.
- Complete both the spec and the plan before finishing.
- Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths or navigate elsewhere.
- The specs/ directory already exists in the current directory.`;

/**
 * WHY: sdd-new-change is the primary workflow for creating new feature specs.
 * If agents aren't invoked correctly, specifications will be malformed or
 * missing critical information.
 */
describe('sdd-new-change command', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-new-change');

    // Create minimal project structure that /sdd-new-change expects
    await mkdir(joinPath(testProject.path, 'specs', 'changes'));
    await mkdir(joinPath(testProject.path, 'specs', 'domain'));
    await mkdir(joinPath(testProject.path, 'components', 'contract'));

    // Create minimal glossary
    await writeFileAsync(
      joinPath(testProject.path, 'specs', 'domain', 'glossary.md'),
      `# Glossary

## Domains

### Core
The primary business domain.

## Terms

(No terms defined yet)
`
    );

    // Create minimal INDEX.md
    await writeFileAsync(
      joinPath(testProject.path, 'specs', 'INDEX.md'),
      `# Specifications Index

## Active Changes

(No changes yet)
`
    );
  });

  /**
   * WHY: The spec-writer and planner agents must be invoked in the correct
   * order (spec-writer first, then planner). Spec-writer creates the SPEC.md
   * which planner needs to create the PLAN.md. Wrong order = broken workflow.
   */
  it('invokes spec-writer and planner agents in correct order', async () => {
    console.log(`\nTest project directory: ${testProject.path}\n`);
    console.log('Created minimal project structure\n');
    console.log('Running /sdd-new-change...');

    const result = await runClaude(NEW_CHANGE_PROMPT, testProject.path, 300);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

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
    const specFile = joinPath(specDir!, 'SPEC.md');
    const specStat = await statAsync(specFile);
    expect(specStat?.isFile()).toBe(true);

    const specContent = await readFileAsync(specFile);
    expect(specContent).toContain('sdd_version:');
    expect(specContent).toContain('issue:');
    expect(specContent).toContain('type:');

    // Verify PLAN.md exists and has correct content
    const planFile = joinPath(specDir!, 'PLAN.md');
    const planStat = await statAsync(planFile);
    expect(planStat?.isFile()).toBe(true);

    const planContent = await readFileAsync(planFile);
    expect(planContent).toContain('sdd_version:');

    console.log('\nAll assertions passed!');
  }, 360000); // 6 minute timeout
});
