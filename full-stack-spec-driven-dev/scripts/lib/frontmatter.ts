/**
 * Frontmatter parsing utilities for spec files.
 * Consolidates duplicated parse_frontmatter() from Python scripts.
 */

export interface Frontmatter {
  readonly [key: string]: string | undefined;
}

export interface ParsedSpec {
  readonly frontmatter: Frontmatter | null;
  readonly content: string;
}

/**
 * Extract YAML frontmatter from markdown content.
 * Returns null if no frontmatter found.
 */
export const parseFrontmatter = (content: string): Frontmatter | null => {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match?.[1]) return null;

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }
  return frontmatter;
};

/**
 * Parse spec file returning frontmatter and body content.
 */
export const parseSpec = (content: string): ParsedSpec => {
  const frontmatter = parseFrontmatter(content);
  const bodyContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  return { frontmatter, content: bodyContent };
};

/**
 * Extract the overview section from spec content (after frontmatter).
 */
export const extractOverview = (content: string): string => {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');

  // Find overview section
  const match = withoutFrontmatter.match(/## Overview\s*\n([\s\S]*?)(?=\n##|$)/);
  return match?.[1]?.trim() ?? '';
};
