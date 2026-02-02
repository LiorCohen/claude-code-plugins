/**
 * Test project helpers.
 * Utilities for creating and managing test project directories.
 */

import { TEST_OUTPUT_DIR } from './paths';
import {
  fileExists,
  isDirectory,
  isFile,
  readFile,
  mkdir,
  rmdir,
  joinPath,
  listDirWithTypes,
} from './fs';

export interface TestProject {
  readonly path: string;
  readonly name: string;
}

/**
 * Create a test project directory.
 */
export const createTestProject = async (name = 'test-project'): Promise<TestProject> => {
  await mkdir(TEST_OUTPUT_DIR);
  const projectDir = joinPath(TEST_OUTPUT_DIR, `${name}-${Date.now()}`);
  await mkdir(projectDir);
  return { path: projectDir, name };
};

/**
 * Remove the test project directory.
 */
export const cleanupTestProject = async (project: TestProject): Promise<void> => {
  if (fileExists(project.path) && project.path.startsWith(TEST_OUTPUT_DIR)) {
    await rmdir(project.path);
  }
};

/**
 * Check if a path exists within the project.
 */
export const projectExists = (project: TestProject, ...parts: readonly string[]): boolean =>
  fileExists(joinPath(project.path, ...parts));

/**
 * Check if a directory exists within the project.
 */
export const projectIsDir = (project: TestProject, ...parts: readonly string[]): boolean =>
  isDirectory(joinPath(project.path, ...parts));

/**
 * Check if a file exists within the project.
 */
export const projectIsFile = (project: TestProject, ...parts: readonly string[]): boolean =>
  isFile(joinPath(project.path, ...parts));

/**
 * Check if a path does NOT exist within the project.
 * Useful for verifying that files/directories were NOT created.
 */
export const projectFileDoesNotExist = (project: TestProject, ...parts: readonly string[]): boolean =>
  !fileExists(joinPath(project.path, ...parts));

/**
 * Check if a file contains a pattern.
 */
export const projectFileContains = (
  project: TestProject,
  filePath: string,
  pattern: string
): boolean => {
  const fullPath = joinPath(project.path, filePath);
  try {
    const content = readFile(fullPath);
    return content.includes(pattern);
  } catch {
    return false;
  }
};

/**
 * Read a file from the project.
 */
export const projectReadFile = (project: TestProject, filePath: string): string =>
  readFile(joinPath(project.path, filePath));

/**
 * Find a directory by name within the project (recursive search).
 */
export const projectFindDir = (project: TestProject, name: string): string | null => {
  const walkDir = (dir: string): string | null => {
    try {
      const entries = listDirWithTypes(dir);
      for (const entry of entries) {
        const fullPath = joinPath(dir, entry.name);
        if (entry.isDirectory) {
          if (entry.name === name) return fullPath;
          const found = walkDir(fullPath);
          if (found) return found;
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
    return null;
  };

  return walkDir(project.path);
};
