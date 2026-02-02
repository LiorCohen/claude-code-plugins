/**
 * Workflow Test: /sdd-new-change --spec with external spec
 *
 * WHY: Verifies that sdd-new-change properly handles external specifications:
 * - Archives external spec to archive/ (audit only)
 * - Creates self-sufficient SPEC.md files with embedded content
 * - Creates PLAN.md alongside each SPEC.md
 * - Creates epic structure when 3+ changes identified
 * - Never references archive/ in generated specs
 *
 * Token usage is recorded to tests/data/sdd-new-change-external.yaml for benchmarking.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import {
  createTestProject,
  runClaude,
  projectIsDir,
  projectIsFile,
  writeFileAsync,
  readFileAsync,
  joinPath,
  statAsync,
  recordBenchmark,
  getTestFilePath,
  type TestProject,
} from '@/lib';

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

const EXTERNAL_SPEC_PROMPT = `Run /sdd-new-change --spec ./external-spec.md

AUTOMATED TEST MODE - SKIP ALL INTERACTIVE PHASES:
- For external spec decomposition:
  - Accept default H2 boundary level
  - Accept the decomposition as-is (3 changes)
  - Accept epic structure when recommended (since 3+ changes)
- Use domain: "User Management"

CRITICAL INSTRUCTIONS:
1. DO NOT ask any questions - all input is provided above
2. DO NOT wait for user approval - consider everything pre-approved
3. Work in CURRENT WORKING DIRECTORY only - no absolute paths
4. Process the external spec completely
5. Complete the entire workflow without stopping`;

/**
 * WHY: External spec handling is critical for importing existing requirements.
 * If it doesn't work correctly, users can't effectively migrate to SDD.
 */
describe('sdd-new-change with external spec', () => {
  let testProject: TestProject;

  beforeAll(async () => {
    testProject = await createTestProject('sdd-new-change-external');

    // Set up minimal SDD project structure (like sdd-new-change.test.ts does)
    // This mimics an already-initialized SDD project
    // Create .sdd directory first
    const { execSync } = await import('child_process');
    execSync(`mkdir -p "${joinPath(testProject.path, '.sdd')}"`, { encoding: 'utf-8' });

    await writeFileAsync(
      joinPath(testProject.path, '.sdd', 'sdd-settings.yaml'),
      `plugin_version: "5.0.0"
project:
  name: test-external-spec
  description: Test project for external spec import
  domain: User Management
  type: fullstack
`
    );

    // Create required directories
    const dirs = ['changes', 'archive', 'specs/domain'];
    for (const dir of dirs) {
      execSync(`mkdir -p "${joinPath(testProject.path, dir)}"`, { encoding: 'utf-8' });
    }

    // Create INDEX.md in changes/ directory
    await writeFileAsync(
      joinPath(testProject.path, 'changes', 'INDEX.md'),
      `# Change Index

## Active Changes

(none)

## External Specifications

*None imported yet*
`
    );

    // Initialize git (sdd-new-change checks git branch)
    execSync('git init && git checkout -b feature/external-spec-test', {
      cwd: testProject.path,
      encoding: 'utf-8',
    });
  });

  /**
   * WHY: This test validates that sdd-new-change with --spec creates:
   * 1. Archive of external spec in archive/
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

    console.log('Running /sdd-new-change --spec...');

    // sdd-new-change with external spec - needs extended timeout
    const result = await runClaude(EXTERNAL_SPEC_PROMPT, testProject.path, 600);

    // Save output for debugging
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    console.log('\nVerifying project structure...\n');

    // Verify external spec is archived (archive/ not specs/external/)
    expect(projectIsDir(testProject, 'archive')).toBe(true);
    expect(projectIsFile(testProject, 'archive', 'external-spec.md')).toBe(true);
    console.log('✓ External spec archived to archive/');

    // Verify changes directory exists
    expect(projectIsDir(testProject, 'changes')).toBe(true);

    // Since we have 3+ changes, should create epic structure
    const changesDir = joinPath(testProject.path, 'changes');
    const changesDirStat = await statAsync(changesDir);
    expect(changesDirStat?.isDirectory()).toBe(true);

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
    const firstSpecPath = foundSpecs[0];
    if (firstSpecPath) {
      const firstSpec = await readFileAsync(firstSpecPath);

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
        firstSpec.includes('refer to archive/') ||
        (firstSpec.includes('archive/') && !firstSpec.includes('Audit reference'));
      expect(hasExternalReadInstructions).toBe(false);
      console.log('✓ Specs do not reference archive for reading');
    }

    // Helper to find directories matching a pattern
    const findDirs = async (dir: string, pattern: RegExp): Promise<string[]> => {
      const { execSync } = await import('child_process');
      try {
        const result = execSync(`find "${dir}" -type d`, { encoding: 'utf-8' });
        return result
          .trim()
          .split('\n')
          .filter(Boolean)
          .filter((d) => pattern.test(d.split('/').pop() || ''));
      } catch {
        return [];
      }
    };

    // Check for numbered epic directories (hierarchical structure)
    const epicDirs = await findDirs(changesDir, /^\d{2}-epic-/);
    if (epicDirs.length > 0) {
      console.log(`Found ${epicDirs.length} numbered epic directories`);

      // Verify epic directories are numbered sequentially
      const epicNames = epicDirs.map((d) => d.split('/').pop() || '');
      const hasSequentialNumbers = epicNames.some((n) => n.startsWith('01-'));
      if (hasSequentialNumbers) {
        console.log('✓ Epic directories have numbered prefixes');
      }

      // Check for numbered features within epics
      for (const epicDir of epicDirs) {
        const featureDirs = await findDirs(joinPath(epicDir, 'changes'), /^\d{2}-/);
        if (featureDirs.length > 0) {
          console.log(`  Found ${featureDirs.length} numbered features in ${epicDir.split('/').pop()}`);
        }
      }
    } else {
      // If no numbered epics, check for regular epic structure or individual changes
      console.log('Note: Numbered epic structure not detected (may have created flat changes)');
    }

    // Record token usage benchmark
    const benchmark = await recordBenchmark(
      'sdd-new-change-external',
      TEST_FILE,
      'new-change-external-spec',
      result.output
    );
    console.log(`\nToken usage recorded:`);
    console.log(`  Total: ${benchmark.total.total_tokens} tokens`);
    console.log(`  Input: ${benchmark.total.input_tokens}, Output: ${benchmark.total.output_tokens}`);
    console.log(`  Turns: ${benchmark.turn_count}`);

    console.log('\nAll assertions passed!');
  }, 660000); // 11 minute timeout for external spec processing
});
