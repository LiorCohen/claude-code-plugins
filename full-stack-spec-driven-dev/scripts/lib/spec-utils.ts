/**
 * Spec file utilities for finding and processing spec files.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parseFrontmatter, type Frontmatter } from './frontmatter.js';

export const EXCLUDED_FILES = ['INDEX.md', 'SNAPSHOT.md', 'glossary.md'] as const;

export interface SpecFile {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
  readonly frontmatter: Frontmatter | null;
}

/**
 * Check if a file should be excluded from spec processing.
 */
export const isExcludedFile = (filename: string): boolean =>
  (EXCLUDED_FILES as readonly string[]).includes(filename);

/**
 * Recursively find all markdown files in a directory.
 */
const walkDir = async (dir: string): Promise<readonly string[]> => {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Find all spec files in a directory, excluding known non-spec files.
 */
export const findSpecFiles = async (specsDir: string): Promise<readonly SpecFile[]> => {
  const allFiles = await walkDir(specsDir);
  const specs: SpecFile[] = [];

  for (const filePath of allFiles) {
    const filename = path.basename(filePath);
    if (isExcludedFile(filename)) continue;

    const content = await fs.readFile(filePath, 'utf-8');
    specs.push({
      path: filePath,
      relativePath: path.relative(specsDir, filePath),
      content,
      frontmatter: parseFrontmatter(content),
    });
  }

  return specs;
};

/**
 * Check if a directory exists.
 */
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};
