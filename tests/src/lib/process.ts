/**
 * Process execution helpers for tests.
 * Tests should use these instead of importing node:child_process directly.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { SKILLS_DIR } from './paths';

export interface RunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunOptions {
  readonly cwd?: string;
  readonly timeout?: number;
  readonly input?: string;
}

/**
 * Run a command and return the result.
 */
export const runCommand = async (
  cmd: string,
  args: readonly string[],
  options: RunOptions = {}
): Promise<RunResult> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [...args], {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdoutChunks: readonly Buffer[] = [];
    const stderrChunks: readonly Buffer[] = [];
    const timeout = options.timeout ?? 120000;

    const timeoutId = setTimeout(() => {
      proc.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    if (options.input) {
      proc.stdin?.write(options.input);
      proc.stdin?.end();
    }

    proc.stdout?.on('data', (data: Buffer) => {
      (stdoutChunks as Buffer[]).push(data);
    });

    proc.stderr?.on('data', (data: Buffer) => {
      (stderrChunks as Buffer[]).push(data);
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      const stdout = Buffer.concat(stdoutChunks as Buffer[]).toString();
      const stderr = Buffer.concat(stderrChunks as Buffer[]).toString();
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

/**
 * Run the scaffolding script with ts-node.
 */
export const runScaffolding = async (configPath: string, cwd: string): Promise<RunResult> => {
  const scaffoldingScript = `${SKILLS_DIR}/scaffolding/scaffolding.ts`;
  return runCommand('npx', ['ts-node', '--esm', scaffoldingScript, '--config', configPath], {
    cwd,
    timeout: 60000,
  });
};

/**
 * Run npm command in the given directory.
 */
export const runNpm = async (
  command: string,
  cwd: string,
  timeoutMs = 300000
): Promise<RunResult> => {
  const args = command.split(' ');
  return runCommand('npm', args, { cwd, timeout: timeoutMs });
};

/**
 * Spawn a background process (returns the process handle for cleanup).
 */
export const spawnBackground = (
  cmd: string,
  args: readonly string[],
  cwd: string
): ChildProcess => {
  return spawn(cmd, [...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
};
