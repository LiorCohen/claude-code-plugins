/**
 * SDD Plugin Test Framework
 * Common utilities for running and validating SDD plugin tests.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SRC_DIR = __dirname; // tests/sdd/src/
export const TESTS_DIR = path.resolve(SRC_DIR, '..'); // tests/sdd/
export const MARKETPLACE_DIR = path.resolve(TESTS_DIR, '../..'); // repository root
export const PLUGIN_DIR = path.join(MARKETPLACE_DIR, 'full-stack-spec-driven-dev');
export const SKILLS_DIR = path.join(PLUGIN_DIR, 'skills');
export const PROMPTS_DIR = path.join(SRC_DIR, 'prompts'); // tests/sdd/src/prompts/
export const TEST_OUTPUT_DIR = process.env['TEST_OUTPUT_DIR'] ?? '/tmp/sdd-tests';

export interface ClaudeResult {
  readonly output: string;
  readonly exitCode: number;
  readonly elapsedSeconds: number;
}

/**
 * Check if output contains a pattern.
 */
export const resultContains = (result: ClaudeResult, pattern: string): boolean =>
  result.output.includes(pattern);

/**
 * Check if output matches a regex pattern.
 */
export const resultMatches = (result: ClaudeResult, pattern: string): boolean =>
  new RegExp(pattern).test(result.output);

/**
 * Check if a specific agent was invoked via Task tool.
 */
export const agentWasUsed = (result: ClaudeResult, agentName: string): boolean => {
  const pattern = new RegExp(`"subagent_type"\\s*:\\s*"${agentName}"`);
  return pattern.test(result.output);
};

/**
 * Check if agents were used in a specific order.
 */
export const agentOrder = (result: ClaudeResult, first: string, second: string): boolean => {
  const firstPattern = new RegExp(`"subagent_type"\\s*:\\s*"${first}"`);
  const secondPattern = new RegExp(`"subagent_type"\\s*:\\s*"${second}"`);

  const firstMatch = firstPattern.exec(result.output);
  const secondMatch = secondPattern.exec(result.output);

  if (!firstMatch || !secondMatch) return false;
  return firstMatch.index < secondMatch.index;
};

export interface TestProject {
  readonly path: string;
  readonly name: string;
}

/**
 * Check if a path exists within the project.
 */
export const projectExists = (project: TestProject, ...parts: readonly string[]): boolean =>
  fs.existsSync(path.join(project.path, ...parts));

/**
 * Check if a directory exists within the project.
 */
export const projectIsDir = (project: TestProject, ...parts: readonly string[]): boolean => {
  const fullPath = path.join(project.path, ...parts);
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Check if a file exists within the project.
 */
export const projectIsFile = (project: TestProject, ...parts: readonly string[]): boolean => {
  const fullPath = path.join(project.path, ...parts);
  try {
    return fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
};

/**
 * Check if a file contains a pattern.
 */
export const projectFileContains = (
  project: TestProject,
  filePath: string,
  pattern: string
): boolean => {
  const fullPath = path.join(project.path, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content.includes(pattern);
  } catch {
    return false;
  }
};

/**
 * Read a file from the project.
 */
export const projectReadFile = (project: TestProject, filePath: string): string =>
  fs.readFileSync(path.join(project.path, filePath), 'utf-8');

/**
 * Find a directory by name within the project.
 */
export const projectFindDir = (project: TestProject, name: string): string | null => {
  const walkDir = (dir: string): string | null => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === name) return fullPath;
        const found = walkDir(fullPath);
        if (found) return found;
      }
    }
    return null;
  };
  return walkDir(project.path);
};

/**
 * Remove the test project directory.
 */
export const projectCleanup = async (project: TestProject): Promise<void> => {
  if (fs.existsSync(project.path) && project.path.startsWith(TEST_OUTPUT_DIR)) {
    await fsp.rm(project.path, { recursive: true, force: true });
  }
};

/**
 * Create a test project directory.
 */
export const createTestProject = async (name = 'test-project'): Promise<TestProject> => {
  await fsp.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  const projectDir = path.join(TEST_OUTPUT_DIR, `${name}-${Date.now()}`);
  await fsp.mkdir(projectDir, { recursive: true });
  return { path: projectDir, name };
};

/**
 * Run Claude CLI with the SDD plugin loaded.
 */
export const runClaude = async (
  prompt: string,
  workingDir: string,
  timeoutSeconds = 120,
  verbose = true
): Promise<ClaudeResult> => {
  await fsp.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  const outputFile = path.join(TEST_OUTPUT_DIR, `output-${Date.now()}.json`);

  const cmd = 'claude';
  const args = [
    '-p',
    prompt,
    '--add-dir',
    MARKETPLACE_DIR,
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'stream-json',
  ];

  if (verbose) {
    console.log(
      `\x1b[1;33mRunning Claude with timeout ${timeoutSeconds}s in ${workingDir}...\x1b[0m`
    );
  }

  const startTime = Date.now();
  let toolCount = 0;
  let lastTool = '';

  return new Promise((resolve, reject) => {
    const process: ChildProcess = spawn(cmd, args, {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const outputLines: string[] = [];
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = (): void => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    const checkTimeout = (): void => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed > timeoutSeconds) {
        cleanup();
        process.kill();
        reject(new Error(`Claude timed out after ${timeoutSeconds}s`));
      } else {
        timeoutId = setTimeout(checkTimeout, 1000);
      }
    };

    timeoutId = setTimeout(checkTimeout, 1000);

    process.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      outputLines.push(line);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      // Check for tool calls
      const toolMatch = /"name":"([^"]+)"/.exec(line);
      if (toolMatch?.[1] && toolMatch[1] !== lastTool) {
        toolCount++;
        lastTool = toolMatch[1];
        if (verbose) {
          console.log(`  \x1b[1;33m[${elapsed}s]\x1b[0m Tool #${toolCount}: ${lastTool}`);
        }
      }

      // Check for agent invocations
      const agentMatch = /"subagent_type":"([^"]+)"/.exec(line);
      if (agentMatch?.[1] && verbose) {
        console.log(`  \x1b[0;32m[${elapsed}s]\x1b[0m Agent invoked: ${agentMatch[1]}`);
      }
    });

    process.stderr?.on('data', (data: Buffer) => {
      outputLines.push(data.toString());
    });

    process.on('close', (code) => {
      cleanup();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const output = outputLines.join('');

      // Save output for debugging
      fs.writeFileSync(outputFile, output);

      if (verbose) {
        if (code === 0) {
          console.log(`\x1b[0;32mClaude completed in ${elapsed}s\x1b[0m`);
        } else {
          console.log(`\x1b[0;31mClaude exited with code ${code} after ${elapsed}s\x1b[0m`);
        }
      }

      resolve({
        output,
        exitCode: code ?? 0,
        elapsedSeconds: elapsed,
      });
    });

    process.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
};

/**
 * Run an npm command in the given directory.
 */
export const runNpm = async (
  command: string,
  cwd: string,
  timeoutMs = 300000
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const process = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error(`npm ${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    process.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    process.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

/**
 * Wait for a server to respond at the given URL.
 */
export const waitForServer = async (
  url: string,
  timeoutSeconds = 30,
  intervalMs = 500
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutSeconds * 1000) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.status < 500) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
};

/**
 * Make an HTTP GET request.
 */
export const httpGet = async (
  url: string,
  timeoutMs = 5000
): Promise<{ status: number; body: unknown }> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { status: response.status, body };
  } catch {
    return { status: 0, body: '' };
  }
};
