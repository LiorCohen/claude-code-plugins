/**
 * Unit Tests: benchmark.ts
 *
 * WHY: The benchmark utilities are critical for tracking token usage over time.
 * Incorrect parsing or serialization would corrupt historical data.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  parseTokenUsage,
  getPluginVersion,
  loadBenchmarkData,
  saveBenchmarkData,
  recordBenchmark,
  getTestFilePath,
  joinPath,
  rmdir,
  mkdtemp,
  type BenchmarkData,
} from '../../../lib';

/**
 * WHY: parseTokenUsage extracts token counts from Claude's stream-json output.
 * Incorrect parsing would lead to wrong benchmark data.
 */
describe('parseTokenUsage', () => {
  /**
   * WHY: Standard Claude output with usage data.
   */
  it('extracts token usage from assistant messages', () => {
    const output = `{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1000,"output_tokens":500}}}
{"type":"tool_result","content":"Done"}
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1200,"output_tokens":300}}}`;

    const result = parseTokenUsage(output);

    expect(result.usage['claude-sonnet-4-20250514']).toBeDefined();
    expect(result.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(2200);
    expect(result.usage['claude-sonnet-4-20250514']!.output_tokens).toBe(800);
    expect(result.usage['claude-sonnet-4-20250514']!.total_tokens).toBe(3000);
  });

  /**
   * WHY: Tests may use multiple models (e.g., Opus for agents, Sonnet for main).
   */
  it('tracks usage per model separately', () => {
    const output = `{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1000,"output_tokens":500}}}
{"type":"assistant","message":{"model":"claude-opus-4-20250514","usage":{"input_tokens":2000,"output_tokens":1000}}}
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":500,"output_tokens":200}}}`;

    const result = parseTokenUsage(output);

    expect(Object.keys(result.usage).length).toBe(2);
    expect(result.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(1500);
    expect(result.usage['claude-opus-4-20250514']!.input_tokens).toBe(2000);
  });

  /**
   * WHY: Total should aggregate across all models.
   */
  it('calculates total across all models', () => {
    const output = `{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1000,"output_tokens":500}}}
{"type":"assistant","message":{"model":"claude-opus-4-20250514","usage":{"input_tokens":2000,"output_tokens":1000}}}`;

    const result = parseTokenUsage(output);

    expect(result.total.input_tokens).toBe(3000);
    expect(result.total.output_tokens).toBe(1500);
    expect(result.total.total_tokens).toBe(4500);
  });

  /**
   * WHY: Turn count is useful for understanding workflow complexity.
   */
  it('counts assistant turns', () => {
    const output = `{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":100,"output_tokens":50}}}
{"type":"tool_result","content":"result"}
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":100,"output_tokens":50}}}
{"type":"tool_result","content":"result"}
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":100,"output_tokens":50}}}`;

    const result = parseTokenUsage(output);

    expect(result.turnCount).toBe(3);
  });

  /**
   * WHY: Non-JSON lines should be skipped gracefully.
   */
  it('skips non-JSON lines', () => {
    const output = `not json
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1000,"output_tokens":500}}}
also not json
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":500,"output_tokens":200}}}`;

    const result = parseTokenUsage(output);

    expect(result.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(1500);
    expect(result.turnCount).toBe(2);
  });

  /**
   * WHY: Messages without usage data should not break parsing.
   */
  it('handles messages without usage data', () => {
    const output = `{"type":"assistant","message":{"model":"claude-sonnet-4-20250514"}}
{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":1000,"output_tokens":500}}}`;

    const result = parseTokenUsage(output);

    // First message counted as turn but no usage added
    expect(result.turnCount).toBe(2);
    expect(result.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(1000);
  });

  /**
   * WHY: Empty output should return zero values, not throw.
   */
  it('returns zeros for empty output', () => {
    const result = parseTokenUsage('');

    expect(Object.keys(result.usage).length).toBe(0);
    expect(result.total.input_tokens).toBe(0);
    expect(result.total.output_tokens).toBe(0);
    expect(result.turnCount).toBe(0);
  });
});

/**
 * WHY: getPluginVersion reads the plugin version for benchmark tracking.
 */
describe('getPluginVersion', () => {
  /**
   * WHY: Should return the actual version from plugin.json.
   */
  it('returns a version string', () => {
    const version = getPluginVersion();

    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  /**
   * WHY: Version should follow semver-like format.
   */
  it('returns version in expected format', () => {
    const version = getPluginVersion();

    // Should be either 'unknown' or a version like '4.0.0'
    if (version !== 'unknown') {
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    }
  });
});

/**
 * WHY: getTestFilePath converts absolute paths to relative for storage.
 */
describe('getTestFilePath', () => {
  /**
   * WHY: Paths should be stored relative for portability.
   */
  it('extracts relative path from tests/', () => {
    const absolutePath = '/some/path/to/tests/src/tests/workflows/sdd-init.test.ts';
    const result = getTestFilePath(absolutePath);

    expect(result).toBe('tests/src/tests/workflows/sdd-init.test.ts');
  });

  /**
   * WHY: Paths not containing tests/ should be returned as-is.
   */
  it('returns original path if tests/ not found', () => {
    const absolutePath = '/some/other/path/test.ts';
    const result = getTestFilePath(absolutePath);

    expect(result).toBe(absolutePath);
  });
});

/**
 * WHY: YAML serialization and parsing must be symmetric.
 */
describe('benchmark data serialization', () => {
  // Test state - using object to track commands for cleanup
  const testState = {
    dir: '',
    commands: [] as readonly string[],
  };

  beforeAll(async () => {
    testState.dir = await mkdtemp('benchmark-test-');
  });

  afterAll(async () => {
    await rmdir(testState.dir);
    // Clean up test files created in the data directory
    const { unlink } = await import('node:fs/promises');
    const { BENCHMARK_DATA_DIR } = await import('../../../lib');
    await Promise.all(
      testState.commands.map(async (name) => {
        try {
          await unlink(joinPath(BENCHMARK_DATA_DIR, `${name}.yaml`));
        } catch {
          // File may not exist
        }
      })
    );
  });

  const trackCommand = (command: string): string => {
    testState.commands = [...testState.commands, command];
    return command;
  };

  /**
   * WHY: loadBenchmarkData should return empty array for non-existent file.
   */
  it('loadBenchmarkData returns empty runs for missing file', async () => {
    const data = await loadBenchmarkData('non-existent-command');

    expect(data.runs).toEqual([]);
  });

  /**
   * WHY: Data should survive a save/load round-trip.
   */
  it('save and load preserves data', async () => {
    const testData: BenchmarkData = {
      runs: [
        {
          timestamp: '2026-01-24T12:00:00.000Z',
          plugin_version: '4.0.0',
          test_file: 'tests/src/tests/workflows/sdd-init.test.ts',
          test_name: 'init-minimal',
          turn_count: 5,
          usage: {
            'claude-sonnet-4-20250514': {
              input_tokens: 1000,
              output_tokens: 500,
              total_tokens: 1500,
            },
          },
          total: {
            input_tokens: 1000,
            output_tokens: 500,
            total_tokens: 1500,
          },
        },
      ],
    };

    // Save to a unique command name to avoid conflicts
    const command = trackCommand(`test-command-${Date.now()}`);
    await saveBenchmarkData(command, testData);

    const loaded = await loadBenchmarkData(command);

    expect(loaded.runs.length).toBe(1);
    expect(loaded.runs[0]!.timestamp).toBe(testData.runs[0]!.timestamp);
    expect(loaded.runs[0]!.plugin_version).toBe(testData.runs[0]!.plugin_version);
    expect(loaded.runs[0]!.test_file).toBe(testData.runs[0]!.test_file);
    expect(loaded.runs[0]!.test_name).toBe(testData.runs[0]!.test_name);
    expect(loaded.runs[0]!.turn_count).toBe(testData.runs[0]!.turn_count);
    expect(loaded.runs[0]!.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(1000);
    expect(loaded.runs[0]!.total.total_tokens).toBe(1500);
  });

  /**
   * WHY: Multiple runs should accumulate, not overwrite.
   */
  it('recordBenchmark appends to existing data', async () => {
    const command = trackCommand(`test-append-${Date.now()}`);

    // First record
    await recordBenchmark(
      command,
      'tests/test1.ts',
      'test-one',
      '{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":100,"output_tokens":50}}}'
    );

    // Second record
    await recordBenchmark(
      command,
      'tests/test2.ts',
      'test-two',
      '{"type":"assistant","message":{"model":"claude-sonnet-4-20250514","usage":{"input_tokens":200,"output_tokens":100}}}'
    );

    const data = await loadBenchmarkData(command);

    expect(data.runs.length).toBe(2);
    expect(data.runs[0]!.test_name).toBe('test-one');
    expect(data.runs[1]!.test_name).toBe('test-two');
  });

  /**
   * WHY: Multi-model usage should be preserved correctly.
   */
  it('preserves multi-model usage data', async () => {
    const testData: BenchmarkData = {
      runs: [
        {
          timestamp: '2026-01-24T12:00:00.000Z',
          plugin_version: '4.0.0',
          test_file: 'test.ts',
          test_name: 'multi-model',
          turn_count: 3,
          usage: {
            'claude-sonnet-4-20250514': {
              input_tokens: 1000,
              output_tokens: 500,
              total_tokens: 1500,
            },
            'claude-opus-4-20250514': {
              input_tokens: 2000,
              output_tokens: 1000,
              total_tokens: 3000,
            },
          },
          total: {
            input_tokens: 3000,
            output_tokens: 1500,
            total_tokens: 4500,
          },
        },
      ],
    };

    const command = trackCommand(`test-multi-model-${Date.now()}`);
    await saveBenchmarkData(command, testData);

    const loaded = await loadBenchmarkData(command);

    expect(Object.keys(loaded.runs[0]!.usage).length).toBe(2);
    expect(loaded.runs[0]!.usage['claude-sonnet-4-20250514']!.input_tokens).toBe(1000);
    expect(loaded.runs[0]!.usage['claude-opus-4-20250514']!.input_tokens).toBe(2000);
    expect(loaded.runs[0]!.total.total_tokens).toBe(4500);
  });
});
