/**
 * Claude CLI helpers for tests.
 * Utilities for running Claude and parsing output.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { MARKETPLACE_DIR, TEST_OUTPUT_DIR } from './paths';
import { mkdir, writeFile, joinPath } from './fs';

export interface ClaudeResult {
  readonly output: string;
  readonly exitCode: number;
  readonly elapsedSeconds: number;
}

export interface ToolUse {
  readonly name: string;
  readonly input: Record<string, unknown>;
  readonly id: string;
}

export interface ParsedOutput {
  readonly toolUses: readonly ToolUse[];
  readonly skillInvocations: readonly string[];
  readonly agentInvocations: readonly string[];
}

/**
 * Run Claude CLI with the SDD plugin loaded.
 */
export const runClaude = async (
  prompt: string,
  workingDir: string,
  timeoutSeconds = 120,
  verbose = true
): Promise<ClaudeResult> => {
  await mkdir(TEST_OUTPUT_DIR);
  const outputFile = joinPath(TEST_OUTPUT_DIR, `output-${Date.now()}.json`);

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
      writeFile(outputFile, output);

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
 * Parse Claude's stream-json output into structured data.
 */
export const parseClaudeOutput = (output: string): ParsedOutput => {
  const toolUses: ToolUse[] = [];
  const skillInvocations: string[] = [];
  const agentInvocations: string[] = [];

  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as {
        type?: string;
        message?: {
          content?: readonly {
            type?: string;
            name?: string;
            input?: Record<string, unknown>;
            id?: string;
          }[];
        };
      };

      if (event.type === 'assistant' && event.message?.content) {
        for (const content of event.message.content) {
          if (content.type === 'tool_use' && content.name && content.id) {
            toolUses.push({
              name: content.name,
              input: content.input ?? {},
              id: content.id,
            });

            if (content.name === 'Skill' && content.input?.['skill']) {
              skillInvocations.push(content.input['skill'] as string);
            }

            if (content.name === 'Task' && content.input?.['subagent_type']) {
              agentInvocations.push(content.input['subagent_type'] as string);
            }
          }
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return { toolUses, skillInvocations, agentInvocations };
};

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
