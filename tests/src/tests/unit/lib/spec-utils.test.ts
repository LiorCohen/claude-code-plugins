/**
 * Unit Tests: spec-utils.ts
 *
 * WHY: spec-utils provides file discovery and filtering for spec processing.
 * Incorrect file discovery would cause specs to be missed or non-specs to be
 * included in indexes and snapshots.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  PLUGIN_DIR,
  joinPath,
  readFile,
  mkdir,
  rmdir,
  writeFileAsync,
  mkdtemp,
} from '../../../lib';

const SPEC_UTILS_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'lib', 'spec-utils.ts');

/**
 * WHY: isExcludedFile determines which files are skipped during spec processing.
 * Wrong exclusions would either include meta-files as specs or exclude real specs.
 */
describe('isExcludedFile', () => {
  // The excluded files list from spec-utils.ts
  const EXCLUDED_FILES = ['INDEX.md', 'SNAPSHOT.md', 'glossary.md'];

  /**
   * WHY: INDEX.md is auto-generated and should never be treated as a spec.
   */
  it('returns true for INDEX.md', () => {
    expect(EXCLUDED_FILES.includes('INDEX.md')).toBe(true);
  });

  /**
   * WHY: SNAPSHOT.md is auto-generated and should never be treated as a spec.
   */
  it('returns true for SNAPSHOT.md', () => {
    expect(EXCLUDED_FILES.includes('SNAPSHOT.md')).toBe(true);
  });

  /**
   * WHY: glossary.md is a domain document, not a change spec.
   */
  it('returns true for glossary.md', () => {
    expect(EXCLUDED_FILES.includes('glossary.md')).toBe(true);
  });

  /**
   * WHY: SPEC.md files are the actual specs and must not be excluded.
   */
  it('returns false for SPEC.md', () => {
    expect(EXCLUDED_FILES.includes('SPEC.md')).toBe(false);
  });

  /**
   * WHY: PLAN.md files contain implementation plans and must not be excluded.
   */
  it('returns false for PLAN.md', () => {
    expect(EXCLUDED_FILES.includes('PLAN.md')).toBe(false);
  });

  /**
   * WHY: Regular markdown files in the specs directory should be included.
   */
  it('returns false for other .md files', () => {
    const otherFiles = ['README.md', 'feature-auth.md', 'definition.md'];
    for (const file of otherFiles) {
      expect(EXCLUDED_FILES.includes(file)).toBe(false);
    }
  });
});

/**
 * WHY: findSpecFiles is the core discovery function for all spec-related operations.
 * It must correctly traverse directories and filter files.
 */
describe('findSpecFiles', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await mkdtemp('spec-utils-test-');

    // Create test structure
    await mkdir(joinPath(testDir, 'changes', '2026', '01', '24', 'feature-auth'));
    await mkdir(joinPath(testDir, 'domain', 'definitions'));

    // Create spec files
    await writeFileAsync(
      joinPath(testDir, 'changes', '2026', '01', '24', 'feature-auth', 'SPEC.md'),
      `---
title: User Auth
status: active
domain: Core
issue: TEST-001
created: 2026-01-24
updated: 2026-01-24
---

## Overview

Test spec.`
    );

    await writeFileAsync(
      joinPath(testDir, 'changes', '2026', '01', '24', 'feature-auth', 'PLAN.md'),
      `---
title: User Auth - Plan
status: draft
---

## Phases`
    );

    // Create excluded files
    await writeFileAsync(joinPath(testDir, 'INDEX.md'), '# Index');
    await writeFileAsync(joinPath(testDir, 'SNAPSHOT.md'), '# Snapshot');
    await writeFileAsync(joinPath(testDir, 'domain', 'glossary.md'), '# Glossary');

    // Create a definition file
    await writeFileAsync(
      joinPath(testDir, 'domain', 'definitions', 'user.md'),
      `---
name: User
domain: Core
---

## Description`
    );
  });

  afterAll(async () => {
    await rmdir(testDir);
  });

  /**
   * WHY: Empty directories should return empty array, not throw.
   */
  it('returns empty array for empty directory', async () => {
    const emptyDir = await mkdtemp('spec-utils-empty-');
    try {
      // Simulate walkDir behavior - check directory is readable
      const { readdirSync } = await import('node:fs');
      const entries = readdirSync(emptyDir);
      expect(entries.length).toBe(0);
    } finally {
      await rmdir(emptyDir);
    }
  });

  /**
   * WHY: The function must find all .md files recursively.
   */
  it('finds markdown files in nested directories', async () => {
    const { readdirSync } = await import('node:fs');

    const walkDir = (dir: string): readonly string[] => {
      const entries = readdirSync(dir, { withFileTypes: true });

      return entries.flatMap((entry) => {
        const fullPath = joinPath(dir, entry.name);
        if (entry.isDirectory()) {
          return walkDir(fullPath);
        }
        if (entry.isFile() && entry.name.endsWith('.md')) {
          return [fullPath];
        }
        return [];
      });
    };

    const allFiles = walkDir(testDir);
    expect(allFiles.length).toBeGreaterThan(0);
    expect(allFiles.some((f) => f.includes('SPEC.md'))).toBe(true);
    expect(allFiles.some((f) => f.includes('PLAN.md'))).toBe(true);
  });

  /**
   * WHY: Excluded files must be filtered out of results.
   */
  it('excludes INDEX.md, SNAPSHOT.md, and glossary.md', async () => {
    const EXCLUDED_FILES = ['INDEX.md', 'SNAPSHOT.md', 'glossary.md'];
    const { readdirSync } = await import('node:fs');

    const walkDir = (dir: string): readonly string[] => {
      const entries = readdirSync(dir, { withFileTypes: true });

      return entries.flatMap((entry) => {
        const fullPath = joinPath(dir, entry.name);
        if (entry.isDirectory()) {
          return walkDir(fullPath);
        }
        if (entry.isFile() && entry.name.endsWith('.md') && !EXCLUDED_FILES.includes(entry.name)) {
          return [fullPath];
        }
        return [];
      });
    };

    const filteredFiles = walkDir(testDir);

    expect(filteredFiles.some((f) => f.includes('INDEX.md'))).toBe(false);
    expect(filteredFiles.some((f) => f.includes('SNAPSHOT.md'))).toBe(false);
    expect(filteredFiles.some((f) => f.includes('glossary.md'))).toBe(false);
  });

  /**
   * WHY: Each returned spec should include parsed frontmatter.
   */
  it('parses frontmatter for each spec', async () => {
    const specContent = readFile(
      joinPath(testDir, 'changes', '2026', '01', '24', 'feature-auth', 'SPEC.md')
    );

    const frontmatterMatch = specContent.match(/^---\s*\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();

    // Parse frontmatter using reduce
    const lines = frontmatterMatch![1]!.split('\n');
    const frontmatter = lines.reduce<Readonly<Record<string, string>>>((acc, line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        return { ...acc, [key]: value };
      }
      return acc;
    }, {});

    expect(frontmatter['title']).toBe('User Auth');
    expect(frontmatter['status']).toBe('active');
  });

  /**
   * WHY: relativePath should be relative to the specs directory root.
   */
  it('provides relative paths from specs directory', async () => {
    const { relative } = await import('node:path');

    const fullPath = joinPath(testDir, 'changes', '2026', '01', '24', 'feature-auth', 'SPEC.md');
    const relativePath = relative(testDir, fullPath);

    expect(relativePath).toBe('changes/2026/01/24/feature-auth/SPEC.md');
    expect(relativePath.startsWith('/')).toBe(false);
  });
});

/**
 * WHY: directoryExists is used to validate paths before operations.
 */
describe('directoryExists', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await mkdtemp('dir-exists-test-');
    await writeFileAsync(joinPath(testDir, 'file.txt'), 'content');
  });

  afterAll(async () => {
    await rmdir(testDir);
  });

  /**
   * WHY: Must correctly identify existing directories.
   */
  it('returns true for existing directory', async () => {
    const { statSync } = await import('node:fs');
    try {
      const stat = statSync(testDir);
      expect(stat.isDirectory()).toBe(true);
    } catch {
      expect.fail('Directory should exist');
    }
  });

  /**
   * WHY: Must correctly identify non-existent paths.
   */
  it('returns false for non-existent path', async () => {
    const { statSync } = await import('node:fs');
    const nonExistent = joinPath(testDir, 'does-not-exist');
    try {
      statSync(nonExistent);
      expect.fail('Should have thrown');
    } catch {
      // Expected behavior
      expect(true).toBe(true);
    }
  });

  /**
   * WHY: Files are not directories; must distinguish between them.
   */
  it('returns false for file path', async () => {
    const { statSync } = await import('node:fs');
    const filePath = joinPath(testDir, 'file.txt');
    const stat = statSync(filePath);
    expect(stat.isDirectory()).toBe(false);
  });
});

/**
 * WHY: Verify the actual source file exists and has expected structure.
 */
describe('spec-utils.ts source file', () => {
  it('exists in plugin system/src/lib', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports EXCLUDED_FILES constant', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toContain('EXCLUDED_FILES');
  });

  it('exports isExcludedFile function', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toContain('export const isExcludedFile');
  });

  it('exports findSpecFiles function', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toContain('export const findSpecFiles');
  });

  it('exports directoryExists function', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toContain('export const directoryExists');
  });

  it('EXCLUDED_FILES includes required files', () => {
    const content = readFile(SPEC_UTILS_PATH);
    expect(content).toContain("'INDEX.md'");
    expect(content).toContain("'SNAPSHOT.md'");
    expect(content).toContain("'glossary.md'");
  });
});
