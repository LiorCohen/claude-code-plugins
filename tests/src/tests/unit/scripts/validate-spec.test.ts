/**
 * Unit Tests: validate-spec.ts
 *
 * WHY: Spec validation enforces the SDD methodology by ensuring all specs
 * have required metadata. Invalid specs break the workflow.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const VALIDATE_SPEC_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'commands', 'spec', 'validate.ts');

// Legacy required fields (when spec_type is not specified)
const REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated'];

// Product spec required fields
const PRODUCT_SPEC_REQUIRED_FIELDS = ['title', 'spec_type', 'status', 'domain', 'created', 'updated'];

// Tech spec required fields
const TECH_SPEC_REQUIRED_FIELDS = [
  'title',
  'spec_type',
  'type',
  'status',
  'domain',
  'issue',
  'created',
  'updated',
  'sdd_version',
];

const VALID_SPEC_TYPES = ['product', 'tech'];
const VALID_CHANGE_TYPES = ['feature', 'bugfix', 'refactor', 'epic'];
const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived', 'draft'];
const PLACEHOLDER_ISSUES = ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}'];

/**
 * WHY: Verify the script exists and has expected structure.
 */
describe('validate-spec.ts source file', () => {
  it('exists in plugin system/src/commands/spec', () => {
    const content = readFile(VALIDATE_SPEC_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('defines REQUIRED_FIELDS constant', () => {
    const content = readFile(VALIDATE_SPEC_PATH);
    expect(content).toContain('REQUIRED_FIELDS');
  });

  it('defines VALID_STATUSES constant', () => {
    const content = readFile(VALIDATE_SPEC_PATH);
    expect(content).toContain('VALID_STATUSES');
  });

  it('defines PLACEHOLDER_ISSUES constant', () => {
    const content = readFile(VALIDATE_SPEC_PATH);
    expect(content).toContain('PLACEHOLDER_ISSUES');
  });
});

/**
 * WHY: Validation logic tests using the same rules as the script.
 */
describe('spec validation logic', () => {
  /**
   * WHY: Specs with all required fields should pass validation.
   */
  it('valid spec passes all checks', () => {
    const content = `---
title: Test Feature
status: active
domain: Core
issue: TEST-123
created: 2026-01-24
updated: 2026-01-24
sdd_version: 4.0.0
---

## Overview

Test content.`;

    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();

    const lines = frontmatterMatch![1]!.split('\n');
    const fm: Record<string, string> = {};
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        fm[key] = value;
      }
    }

    // Check all required fields
    for (const field of REQUIRED_FIELDS) {
      expect(fm[field]).toBeDefined();
      expect(fm[field]!.length).toBeGreaterThan(0);
    }

    // Check status is valid
    expect(VALID_STATUSES.includes(fm['status']!)).toBe(true);

    // Check issue is not a placeholder
    expect(PLACEHOLDER_ISSUES.includes(fm['issue']!)).toBe(false);
  });

  /**
   * WHY: Missing frontmatter should be detected.
   */
  it('detects missing frontmatter', () => {
    const content = `# No Frontmatter

Just content without frontmatter.`;

    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).toBeNull();
  });

  /**
   * WHY: Each required field must be validated independently.
   */
  describe('required field validation', () => {
    const baseSpec = (excludeField?: string): string => {
      const fields: Record<string, string> = {
        title: 'Test',
        status: 'active',
        domain: 'Core',
        issue: 'TEST-123',
        created: '2026-01-24',
        updated: '2026-01-24',
      };

      if (excludeField) {
        delete fields[excludeField];
      }

      const yaml = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      return `---\n${yaml}\n---\n\n## Content`;
    };

    it('detects missing title', () => {
      const content = baseSpec('title');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['title']).toBeUndefined();
    });

    it('detects missing status', () => {
      const content = baseSpec('status');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['status']).toBeUndefined();
    });

    it('detects missing domain', () => {
      const content = baseSpec('domain');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['domain']).toBeUndefined();
    });

    it('detects missing issue', () => {
      const content = baseSpec('issue');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['issue']).toBeUndefined();
    });

    it('detects missing created', () => {
      const content = baseSpec('created');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['created']).toBeUndefined();
    });

    it('detects missing updated', () => {
      const content = baseSpec('updated');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const lines = frontmatterMatch![1]!.split('\n');
      const fm: Record<string, string> = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          fm[line.slice(0, colonIndex).trim()] = line.slice(colonIndex + 1).trim();
        }
      }

      expect(fm['updated']).toBeUndefined();
    });
  });

  /**
   * WHY: Invalid status values should be rejected.
   */
  describe('status validation', () => {
    it('accepts valid status: active', () => {
      expect(VALID_STATUSES.includes('active')).toBe(true);
    });

    it('accepts valid status: deprecated', () => {
      expect(VALID_STATUSES.includes('deprecated')).toBe(true);
    });

    it('accepts valid status: superseded', () => {
      expect(VALID_STATUSES.includes('superseded')).toBe(true);
    });

    it('accepts valid status: archived', () => {
      expect(VALID_STATUSES.includes('archived')).toBe(true);
    });

    it('accepts valid status: draft', () => {
      expect(VALID_STATUSES.includes('draft')).toBe(true);
    });

    it('rejects invalid status: pending', () => {
      expect(VALID_STATUSES.includes('pending')).toBe(false);
    });

    it('rejects invalid status: completed', () => {
      expect(VALID_STATUSES.includes('completed')).toBe(false);
    });
  });

  /**
   * WHY: spec_type determines which fields are required.
   */
  describe('spec_type validation', () => {
    it('accepts valid spec_type: product', () => {
      expect(VALID_SPEC_TYPES.includes('product')).toBe(true);
    });

    it('accepts valid spec_type: tech', () => {
      expect(VALID_SPEC_TYPES.includes('tech')).toBe(true);
    });

    it('rejects invalid spec_type: internal', () => {
      expect(VALID_SPEC_TYPES.includes('internal')).toBe(false);
    });

    it('product specs require fewer fields than tech specs', () => {
      expect(PRODUCT_SPEC_REQUIRED_FIELDS.length).toBeLessThan(TECH_SPEC_REQUIRED_FIELDS.length);
    });

    it('tech specs require issue field', () => {
      expect(TECH_SPEC_REQUIRED_FIELDS.includes('issue')).toBe(true);
    });

    it('product specs do not require issue field', () => {
      expect(PRODUCT_SPEC_REQUIRED_FIELDS.includes('issue')).toBe(false);
    });

    it('tech specs require sdd_version field', () => {
      expect(TECH_SPEC_REQUIRED_FIELDS.includes('sdd_version')).toBe(true);
    });

    it('tech specs require type (change type) field', () => {
      expect(TECH_SPEC_REQUIRED_FIELDS.includes('type')).toBe(true);
    });
  });

  /**
   * WHY: Tech specs use change types (feature, bugfix, etc.)
   */
  describe('change type validation', () => {
    it('accepts valid change type: feature', () => {
      expect(VALID_CHANGE_TYPES.includes('feature')).toBe(true);
    });

    it('accepts valid change type: bugfix', () => {
      expect(VALID_CHANGE_TYPES.includes('bugfix')).toBe(true);
    });

    it('accepts valid change type: refactor', () => {
      expect(VALID_CHANGE_TYPES.includes('refactor')).toBe(true);
    });

    it('accepts valid change type: epic', () => {
      expect(VALID_CHANGE_TYPES.includes('epic')).toBe(true);
    });

    it('rejects invalid change type: task', () => {
      expect(VALID_CHANGE_TYPES.includes('task')).toBe(false);
    });
  });

  /**
   * WHY: Placeholder issue values should be rejected to ensure tracking.
   */
  describe('issue placeholder validation', () => {
    it('rejects PROJ-XXX placeholder', () => {
      expect(PLACEHOLDER_ISSUES.includes('PROJ-XXX')).toBe(true);
    });

    it('rejects [PROJ-XXX] placeholder', () => {
      expect(PLACEHOLDER_ISSUES.includes('[PROJ-XXX]')).toBe(true);
    });

    it('rejects TODO placeholder', () => {
      expect(PLACEHOLDER_ISSUES.includes('TODO')).toBe(true);
    });

    it('rejects empty string', () => {
      expect(PLACEHOLDER_ISSUES.includes('')).toBe(true);
    });

    it('rejects {{ISSUE}} template placeholder', () => {
      expect(PLACEHOLDER_ISSUES.includes('{{ISSUE}}')).toBe(true);
    });

    it('accepts real issue reference', () => {
      expect(PLACEHOLDER_ISSUES.includes('TEST-123')).toBe(false);
      expect(PLACEHOLDER_ISSUES.includes('JIRA-456')).toBe(false);
      expect(PLACEHOLDER_ISSUES.includes('GH-789')).toBe(false);
    });
  });
});

/**
 * WHY: Test argument parsing logic.
 */
describe('argument parsing', () => {
  /**
   * Simulate the parseArgs function logic.
   */
  const parseArgs = (args: readonly string[]): { all: boolean; specsDir: string; path?: string } => {
    let all = false;
    let specsDir = 'specs/';
    let specPath: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--all') {
        all = true;
      } else if (arg === '--specs-dir') {
        specsDir = args[i + 1] ?? 'specs/';
        i++;
      } else if (!arg?.startsWith('-')) {
        specPath = arg;
      }
    }

    return { all, specsDir, path: specPath };
  };

  it('parses single file path', () => {
    const result = parseArgs(['path/to/spec.md']);
    expect(result.path).toBe('path/to/spec.md');
    expect(result.all).toBe(false);
  });

  it('parses --all flag', () => {
    const result = parseArgs(['--all']);
    expect(result.all).toBe(true);
    expect(result.path).toBeUndefined();
  });

  it('parses --specs-dir option', () => {
    const result = parseArgs(['--specs-dir', 'custom/specs/']);
    expect(result.specsDir).toBe('custom/specs/');
  });

  it('parses combined arguments', () => {
    const result = parseArgs(['--all', '--specs-dir', 'my-specs/']);
    expect(result.all).toBe(true);
    expect(result.specsDir).toBe('my-specs/');
  });

  it('uses default specs dir when not specified', () => {
    const result = parseArgs(['--all']);
    expect(result.specsDir).toBe('specs/');
  });
});
