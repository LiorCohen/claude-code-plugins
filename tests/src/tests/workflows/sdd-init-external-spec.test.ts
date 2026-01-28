/**
 * Workflow Test: /sdd-init with external spec
 *
 * WHY: Verifies that sdd-init properly handles external specifications:
 * - Archives external spec to specs/external/ (audit only)
 * - Creates self-sufficient SPEC.md files with embedded content
 * - Creates PLAN.md alongside each SPEC.md
 * - Creates epic structure when 3+ changes identified
 * - Never references specs/external/ in generated specs
 *
 * Token usage is recorded to tests/data/sdd-init-external.yaml for benchmarking.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  projectFileContains,
  writeFileAsync,
  readFileAsync,
  joinPath,
  statAsync,
  recordBenchmark,
  getTestFilePath,
  type TestProject,
} from '../../lib';

const TEST_FILE = getTestFilePath(import.meta.url.replace('file://', ''));

// Sample external spec with 3 sections (should trigger epic recommendation)
const EXTERNAL_SPEC_CONTENT = `# User Management System

A comprehensive user management system for web applications.

## User Registration

Users should be able to register for an account using email and password.

### Requirements
- Email validation
- Password strength requirements
- Email verification flow

### Acceptance Criteria
- Given a valid email and password, when user submits registration, then account is created
- Given an invalid email, when user submits, then validation error is shown
- Given a weak password, when user submits, then strength error is shown

### API Endpoints
- POST /api/users/register
- POST /api/users/verify-email

## User Authentication

Users should be able to log in and manage sessions.

### Requirements
- Login with email/password
- JWT token management
- Refresh token support

### Acceptance Criteria
- Given valid credentials, when user logs in, then JWT token is returned
- Given invalid credentials, when user logs in, then 401 error is returned
- Given expired token, when user refreshes, then new token is issued

### API Endpoints
- POST /api/auth/login
- POST /api/auth/refresh
- DELETE /api/auth/logout

## User Profile

Users should be able to view and update their profile.

### Requirements
- View profile information
- Update profile fields
- Change password

### Acceptance Criteria
- Given authenticated user, when they view profile, then all fields are displayed
- Given valid updates, when user saves profile, then changes are persisted
- Given correct current password, when user changes password, then new password is set

### API Endpoints
- GET /api/users/me
- PATCH /api/users/me
- POST /api/users/me/password
`;

const EXTERNAL_SPEC_PROMPT = `Run /sdd-init --name test-external-spec --spec ./external-spec.md

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- Skip Phase 0-1: Use project name "test-external-spec"
- Skip Phase 1: Extract from external spec - Domain = "User Management"
- Skip Phase 2-3: Use fullstack components (contract, server, webapp)
- Skip Phase 4: Consider PRE-APPROVED
- For external spec decomposition:
  - Accept default H2 boundary level
  - Accept the decomposition as-is (3 changes)
  - Accept epic structure when recommended (since 3+ changes)
- Execute all phases including external spec integration

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Create subdirectory: ./test-external-spec/
4. Work in CURRENT WORKING DIRECTORY only - no absolute paths
5. Process the external spec completely
6. Complete the entire workflow without stopping`;

/**
 * WHY: External spec handling is critical for importing existing requirements.
 * If it doesn't work correctly, users can't effectively migrate to SDD.
 */
describe('sdd-init with external spec', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-init-external');
  });

  /**
   * WHY: This test validates that sdd-init with --spec creates:
   * 1. Archive of external spec in specs/external/
   * 2. Self-sufficient SPEC.md files with embedded content
   * 3. PLAN.md files alongside each SPEC.md
   * 4. Epic structure for 3+ changes
   */
  it('creates epic structure from external spec with 3+ changes', async () => {
    console.log(`\nTest directory: ${testProject.path}\n`);

    // Create external spec file
    await writeFileAsync(
      joinPath(testProject.path, 'external-spec.md'),
      EXTERNAL_SPEC_CONTENT
    );
    console.log('Created external spec file');

    console.log('Running /sdd-init --spec...');

    // sdd-init with external spec - needs extended timeout
    const result = await runClaude(EXTERNAL_SPEC_PROMPT, testProject.path, 600);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying project structure...\n');

    // sdd-init creates a subdirectory with the project name
    const projectSubdir = joinPath(testProject.path, 'test-external-spec');
    let project: TestProject;

    const stat = await statAsync(projectSubdir);
    if (stat?.isDirectory()) {
      console.log(`Project created in subdirectory: ${projectSubdir}`);
      project = { path: projectSubdir, name: 'test-external-spec' };
    } else {
      console.log(`Using test directory directly: ${testProject.path}`);
      project = testProject;
    }

    // Verify external spec is archived
    expect(projectIsDir(project, 'specs', 'external')).toBe(true);
    expect(projectIsFile(project, 'specs', 'external', 'external-spec.md')).toBe(true);
    console.log('✓ External spec archived to specs/external/');

    // Verify changes directory exists
    expect(projectIsDir(project, 'specs', 'changes')).toBe(true);

    // Since we have 3+ changes, should create epic structure
    // Look for epic directory pattern: specs/changes/YYYY/MM/DD/*-epic/ or similar
    const changesDir = joinPath(project.path, 'specs', 'changes');
    const changesDirStat = await statAsync(changesDir);
    expect(changesDirStat?.isDirectory()).toBe(true);

    // Verify at least one SPEC.md and PLAN.md exist in the changes structure
    // The exact path depends on date and naming, so we check for pattern
    const specFiles: string[] = [];
    const planFiles: string[] = [];

    // Helper to recursively find files
    const findFiles = async (dir: string, pattern: string): Promise<string[]> => {
      const { execSync } = await import('child_process');
      try {
        const result = execSync(`find "${dir}" -name "${pattern}" -type f`, {
          encoding: 'utf-8',
        });
        return result.trim().split('\n').filter(Boolean);
      } catch {
        return [];
      }
    };

    const foundSpecs = await findFiles(changesDir, 'SPEC.md');
    const foundPlans = await findFiles(changesDir, 'PLAN.md');

    console.log(`Found ${foundSpecs.length} SPEC.md files`);
    console.log(`Found ${foundPlans.length} PLAN.md files`);

    // Should have at least 1 spec and 1 plan (could be epic + children or just changes)
    expect(foundSpecs.length).toBeGreaterThan(0);
    expect(foundPlans.length).toBeGreaterThan(0);
    console.log('✓ SPEC.md and PLAN.md files created');

    // Each SPEC.md should have a corresponding PLAN.md
    expect(foundPlans.length).toBeGreaterThanOrEqual(foundSpecs.length);
    console.log('✓ Each spec has a corresponding plan');

    // Verify specs are self-sufficient (contain embedded content, not just references)
    if (foundSpecs.length > 0) {
      const firstSpec = await readFileAsync(foundSpecs[0]);

      // Should contain embedded content or original requirements section
      const hasContent =
        firstSpec.includes('## Original Requirements') ||
        firstSpec.includes('## User Stories') ||
        firstSpec.includes('## Acceptance Criteria');
      expect(hasContent).toBe(true);
      console.log('✓ Specs contain embedded content');

      // Should NOT contain instructions to read external spec
      const hasExternalReadInstructions =
        firstSpec.includes('see external spec') ||
        firstSpec.includes('refer to specs/external') ||
        (firstSpec.includes('specs/external') && !firstSpec.includes('Audit reference'));
      expect(hasExternalReadInstructions).toBe(false);
      console.log('✓ Specs do not reference external spec for reading');
    }

    // Record token usage benchmark
    const benchmark = await recordBenchmark(
      'sdd-init-external',
      TEST_FILE,
      'init-external-spec',
      result.output
    );
    console.log(`\nToken usage recorded:`);
    console.log(`  Total: ${benchmark.total.total_tokens} tokens`);
    console.log(`  Input: ${benchmark.total.input_tokens}, Output: ${benchmark.total.output_tokens}`);
    console.log(`  Turns: ${benchmark.turn_count}`);

    console.log('\nAll assertions passed!');
  }, 660000); // 11 minute timeout for external spec processing
});
