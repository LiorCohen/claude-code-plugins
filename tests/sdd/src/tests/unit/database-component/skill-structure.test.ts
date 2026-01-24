/**
 * Database Component Skill Structure Tests
 *
 * WHY: Validates that the database-scaffolding skill exists and follows
 * the correct structure expected by the SDD plugin loader.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, isDirectory, readFile } from '../../../lib';

const DATABASE_SKILL_DIR = joinPath(SKILLS_DIR, 'database-scaffolding');

/**
 * WHY: The database-scaffolding skill must exist and be properly structured
 * for the scaffolding system to generate database components. Without this,
 * users cannot add database components to their projects.
 */
describe('Database Skill Structure', () => {
  /**
   * WHY: The skill directory is the entry point for all database scaffolding.
   * If it doesn't exist, the entire database component feature is broken.
   */
  it('skill directory exists', () => {
    expect(fileExists(DATABASE_SKILL_DIR)).toBe(true);
    expect(isDirectory(DATABASE_SKILL_DIR)).toBe(true);
  });

  /**
   * WHY: SKILL.md is required by the plugin system to discover and load skills.
   * Without it, Claude won't know the database-scaffolding skill exists.
   */
  it('SKILL.md exists', () => {
    const skillMd = joinPath(DATABASE_SKILL_DIR, 'SKILL.md');
    expect(fileExists(skillMd)).toBe(true);
  });

  /**
   * WHY: Frontmatter fields like 'name' and 'description' are required for
   * skill discovery and documentation. Missing fields cause plugin loader errors.
   */
  it('SKILL.md has required frontmatter fields', () => {
    const skillMd = joinPath(DATABASE_SKILL_DIR, 'SKILL.md');
    const content = readFile(skillMd);

    expect(content).toContain('---');
    expect(content).toContain('name: database-scaffolding');
    expect(content).toContain('description:');
  });

  /**
   * WHY: Templates directory contains all the files that get copied during
   * scaffolding. Without it, no files would be generated for the database component.
   */
  it('templates directory exists', () => {
    const templatesDir = joinPath(DATABASE_SKILL_DIR, 'templates');
    expect(fileExists(templatesDir)).toBe(true);
    expect(isDirectory(templatesDir)).toBe(true);
  });
});
