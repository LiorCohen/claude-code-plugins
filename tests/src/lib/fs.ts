/**
 * File system helpers for tests.
 * Tests should use these instead of importing node:fs directly.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export interface DirEntry {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
}

export const joinPath = (...parts: readonly string[]): string => path.join(...parts);

export const fileExists = (filepath: string): boolean => fs.existsSync(filepath);

export const dirExists = (filepath: string): boolean => {
  try {
    return fs.statSync(filepath).isDirectory();
  } catch {
    return false;
  }
};

export const isFile = (filepath: string): boolean => {
  try {
    return fs.statSync(filepath).isFile();
  } catch {
    return false;
  }
};

export const isDirectory = (filepath: string): boolean => {
  try {
    return fs.statSync(filepath).isDirectory();
  } catch {
    return false;
  }
};

export const readFile = (filepath: string): string => fs.readFileSync(filepath, 'utf-8');

export const readFileAsync = (filepath: string): Promise<string> => fsp.readFile(filepath, 'utf-8');

export const writeFile = (filepath: string, content: string): void => {
  fs.writeFileSync(filepath, content, 'utf-8');
};

export const writeFileAsync = (filepath: string, content: string): Promise<void> =>
  fsp.writeFile(filepath, content, 'utf-8');

export const mkdir = (dirpath: string): Promise<void> =>
  fsp.mkdir(dirpath, { recursive: true }).then(() => undefined);

export const rmdir = (dirpath: string): Promise<void> =>
  fsp.rm(dirpath, { recursive: true, force: true });

export const mkdtemp = (prefix: string): Promise<string> =>
  fsp.mkdtemp(path.join(os.tmpdir(), prefix));

export const listDir = (dirpath: string): readonly string[] => [...fs.readdirSync(dirpath)];

export const listDirWithTypes = (dirpath: string): readonly DirEntry[] =>
  fs.readdirSync(dirpath, { withFileTypes: true }).map((e) => ({
    name: e.name,
    isDirectory: e.isDirectory(),
    isFile: e.isFile(),
  }));

export const stat = (filepath: string): fs.Stats | null => {
  try {
    return fs.statSync(filepath);
  } catch {
    return null;
  }
};

export const statAsync = async (filepath: string): Promise<fs.Stats | null> => {
  try {
    return await fsp.stat(filepath);
  } catch {
    return null;
  }
};
