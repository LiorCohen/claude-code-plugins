/**
 * Token usage benchmarking utilities.
 * Captures and persists token usage data for regression tracking.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { TESTS_ROOT_DIR, PLUGIN_DIR } from './paths';

export const BENCHMARK_DATA_DIR = path.join(TESTS_ROOT_DIR, 'data');

export interface TokenUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly total_tokens: number;
}

export interface BenchmarkRun {
  readonly timestamp: string;
  readonly plugin_version: string;
  readonly test_file: string;
  readonly test_name: string;
  readonly turn_count: number;
  readonly usage: Readonly<Record<string, TokenUsage>>;
  readonly total: TokenUsage;
}

export interface BenchmarkData {
  readonly runs: readonly BenchmarkRun[];
}

/**
 * Get the plugin version from plugin.json.
 */
export const getPluginVersion = (): string => {
  try {
    const pluginJsonPath = path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json');
    const content = fs.readFileSync(pluginJsonPath, 'utf-8');
    const json = JSON.parse(content) as { version?: string };
    return json.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

interface ParsedEvent {
  readonly type?: string;
  readonly message?: {
    readonly model?: string;
    readonly usage?: {
      readonly input_tokens?: number;
      readonly output_tokens?: number;
    };
  };
}

interface ParseState {
  readonly usage: Readonly<Record<string, TokenUsage>>;
  readonly turnCount: number;
}

/**
 * Parse token usage from Claude's stream-json output.
 * Extracts usage data per model.
 */
export const parseTokenUsage = (
  output: string
): { readonly usage: Readonly<Record<string, TokenUsage>>; readonly total: TokenUsage; readonly turnCount: number } => {
  const lines = output.split('\n').filter((line) => line.trim());

  const result = lines.reduce<ParseState>(
    (acc, line) => {
      try {
        const event = JSON.parse(line) as ParsedEvent;

        if (event.type === 'assistant') {
          const model = event.message?.model;
          const eventUsage = event.message?.usage;

          if (model && eventUsage) {
            const inputTokens = eventUsage.input_tokens ?? 0;
            const outputTokens = eventUsage.output_tokens ?? 0;
            const current = acc.usage[model] ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

            return {
              usage: {
                ...acc.usage,
                [model]: {
                  input_tokens: current.input_tokens + inputTokens,
                  output_tokens: current.output_tokens + outputTokens,
                  total_tokens: current.total_tokens + inputTokens + outputTokens,
                },
              },
              turnCount: acc.turnCount + 1,
            };
          }

          return { ...acc, turnCount: acc.turnCount + 1 };
        }
      } catch {
        // Skip non-JSON lines
      }
      return acc;
    },
    { usage: {}, turnCount: 0 }
  );

  // Calculate totals using reduce
  const totals = Object.values(result.usage).reduce(
    (acc, modelUsage) => ({
      input: acc.input + modelUsage.input_tokens,
      output: acc.output + modelUsage.output_tokens,
    }),
    { input: 0, output: 0 }
  );

  return {
    usage: result.usage,
    total: {
      input_tokens: totals.input,
      output_tokens: totals.output,
      total_tokens: totals.input + totals.output,
    },
    turnCount: result.turnCount,
  };
};

/**
 * Get the benchmark data file path for a command.
 */
export const getBenchmarkFilePath = (command: string): string =>
  path.join(BENCHMARK_DATA_DIR, `${command}.yaml`);

interface YamlParseState {
  readonly runs: readonly BenchmarkRun[];
  readonly currentRun: Partial<BenchmarkRun> | null;
  readonly currentUsage: Readonly<Record<string, TokenUsage>>;
  readonly currentTotal: Partial<TokenUsage>;
  readonly inUsage: boolean;
  readonly inTotal: boolean;
  readonly currentModel: string;
  readonly currentModelUsage: Partial<TokenUsage>;
}

const createEmptyState = (): YamlParseState => ({
  runs: [],
  currentRun: null,
  currentUsage: {},
  currentTotal: {},
  inUsage: false,
  inTotal: false,
  currentModel: '',
  currentModelUsage: {},
});

const finalizeRun = (state: YamlParseState): BenchmarkRun | null => {
  if (!state.currentRun?.timestamp) return null;

  const finalUsage =
    state.currentModel && Object.keys(state.currentModelUsage).length > 0
      ? {
          ...state.currentUsage,
          [state.currentModel]: {
            input_tokens: state.currentModelUsage.input_tokens ?? 0,
            output_tokens: state.currentModelUsage.output_tokens ?? 0,
            total_tokens: state.currentModelUsage.total_tokens ?? 0,
          },
        }
      : state.currentUsage;

  return {
    timestamp: state.currentRun.timestamp,
    plugin_version: state.currentRun.plugin_version ?? 'unknown',
    test_file: state.currentRun.test_file ?? '',
    test_name: state.currentRun.test_name ?? '',
    turn_count: state.currentRun.turn_count ?? 0,
    usage: finalUsage,
    total: {
      input_tokens: state.currentTotal.input_tokens ?? 0,
      output_tokens: state.currentTotal.output_tokens ?? 0,
      total_tokens: state.currentTotal.total_tokens ?? 0,
    },
  };
};

const processYamlLine = (state: YamlParseState, trimmed: string): YamlParseState => {
  // New run entry
  if (trimmed === '  - timestamp:' || trimmed.match(/^ {2}- timestamp: /)) {
    const previousRun = finalizeRun(state);
    const match = trimmed.match(/timestamp: ["']?([^"']+)["']?/);
    return {
      runs: previousRun ? [...state.runs, previousRun] : state.runs,
      currentRun: match ? { timestamp: match[1] } : {},
      currentUsage: {},
      currentTotal: {},
      inUsage: false,
      inTotal: false,
      currentModel: '',
      currentModelUsage: {},
    };
  }

  if (!state.currentRun) return state;

  // Parse fields
  if (trimmed.match(/^ {4}plugin_version:/)) {
    const match = trimmed.match(/plugin_version: ["']?([^"']+)["']?/);
    return match
      ? { ...state, currentRun: { ...state.currentRun, plugin_version: match[1] }, inUsage: false, inTotal: false }
      : { ...state, inUsage: false, inTotal: false };
  }

  if (trimmed.match(/^ {4}test_file:/)) {
    const match = trimmed.match(/test_file: ["']?([^"']+)["']?/);
    return match
      ? { ...state, currentRun: { ...state.currentRun, test_file: match[1] }, inUsage: false, inTotal: false }
      : { ...state, inUsage: false, inTotal: false };
  }

  if (trimmed.match(/^ {4}test_name:/)) {
    const match = trimmed.match(/test_name: ["']?([^"']+)["']?/);
    return match
      ? { ...state, currentRun: { ...state.currentRun, test_name: match[1] }, inUsage: false, inTotal: false }
      : { ...state, inUsage: false, inTotal: false };
  }

  if (trimmed.match(/^ {4}turn_count:/)) {
    const match = trimmed.match(/turn_count: (\d+)/);
    return match?.[1]
      ? { ...state, currentRun: { ...state.currentRun, turn_count: parseInt(match[1], 10) }, inUsage: false, inTotal: false }
      : { ...state, inUsage: false, inTotal: false };
  }

  if (trimmed === '    usage:') {
    return { ...state, inUsage: true, inTotal: false };
  }

  if (trimmed === '    total:') {
    return { ...state, inUsage: false, inTotal: true };
  }

  if (state.inUsage && trimmed.match(/^ {6}[a-z]/)) {
    const updatedUsage =
      state.currentModel && Object.keys(state.currentModelUsage).length > 0
        ? {
            ...state.currentUsage,
            [state.currentModel]: {
              input_tokens: state.currentModelUsage.input_tokens ?? 0,
              output_tokens: state.currentModelUsage.output_tokens ?? 0,
              total_tokens: state.currentModelUsage.total_tokens ?? 0,
            },
          }
        : state.currentUsage;

    const match = trimmed.match(/^ {6}([^:]+):/);
    return match?.[1]
      ? { ...state, currentUsage: updatedUsage, currentModel: match[1], currentModelUsage: {} }
      : { ...state, currentUsage: updatedUsage };
  }

  if (state.inUsage && state.currentModel && trimmed.match(/^ {8}(input_tokens|output_tokens|total_tokens):/)) {
    const match = trimmed.match(/(input_tokens|output_tokens|total_tokens): (\d+)/);
    if (match?.[1] && match[2]) {
      const key = match[1] as keyof TokenUsage;
      return { ...state, currentModelUsage: { ...state.currentModelUsage, [key]: parseInt(match[2], 10) } };
    }
  }

  if (state.inTotal && trimmed.match(/^ {6}(input_tokens|output_tokens|total_tokens):/)) {
    const match = trimmed.match(/(input_tokens|output_tokens|total_tokens): (\d+)/);
    if (match?.[1] && match[2]) {
      const key = match[1] as keyof TokenUsage;
      return { ...state, currentTotal: { ...state.currentTotal, [key]: parseInt(match[2], 10) } };
    }
  }

  return state;
};

/**
 * Parse YAML manually (simple format, no dependencies).
 */
const parseYaml = (content: string): BenchmarkData => {
  const lines = content.split('\n');

  const finalState = lines.reduce((state, line) => processYamlLine(state, line.trimEnd()), createEmptyState());

  // Finalize the last run
  const lastRun = finalizeRun(finalState);
  const runs = lastRun ? [...finalState.runs, lastRun] : finalState.runs;

  return { runs };
};

/**
 * Generate the header comment for a command's benchmark file.
 */
const getBenchmarkHeader = (command: string): string => `
# Token usage benchmarks for /${command} command.
# Appended by workflow tests after each run.
#
# Fields:
#   timestamp: ISO 8601 timestamp of test run
#   plugin_version: SDD plugin version from plugin.json
#   test_file: Path to the test file
#   test_name: Test function/case name
#   turn_count: Number of API round-trips
#   usage: Token usage breakdown by model
#   total: Aggregate token usage across all models
`;

/**
 * Serialize a single run to YAML lines.
 */
const serializeRun = (run: BenchmarkRun): readonly string[] => {
  const usageLines = Object.entries(run.usage).flatMap(([model, usage]) => [
    `      ${model}:`,
    `        input_tokens: ${usage.input_tokens}`,
    `        output_tokens: ${usage.output_tokens}`,
    `        total_tokens: ${usage.total_tokens}`,
  ]);

  return [
    `  - timestamp: "${run.timestamp}"`,
    `    plugin_version: "${run.plugin_version}"`,
    `    test_file: "${run.test_file}"`,
    `    test_name: "${run.test_name}"`,
    `    turn_count: ${run.turn_count}`,
    '    usage:',
    ...usageLines,
    '    total:',
    `      input_tokens: ${run.total.input_tokens}`,
    `      output_tokens: ${run.total.output_tokens}`,
    `      total_tokens: ${run.total.total_tokens}`,
  ];
};

/**
 * Serialize benchmark data to YAML.
 */
const serializeYaml = (data: BenchmarkData, command?: string): string => {
  const header = command ? getBenchmarkHeader(command) : '';
  const headerLine = header ? header + 'runs:' : 'runs:';
  const runLines = data.runs.flatMap(serializeRun);

  return [headerLine, ...runLines].join('\n') + '\n';
};

/**
 * Load existing benchmark data from file.
 */
export const loadBenchmarkData = async (command: string): Promise<BenchmarkData> => {
  const filePath = getBenchmarkFilePath(command);

  try {
    const content = await fsp.readFile(filePath, 'utf-8');
    return parseYaml(content);
  } catch {
    return { runs: [] };
  }
};

/**
 * Save benchmark data to file.
 */
export const saveBenchmarkData = async (command: string, data: BenchmarkData): Promise<void> => {
  const filePath = getBenchmarkFilePath(command);

  // Ensure data directory exists
  await fsp.mkdir(BENCHMARK_DATA_DIR, { recursive: true });

  const content = serializeYaml(data, command);
  await fsp.writeFile(filePath, content, 'utf-8');
};

/**
 * Record a benchmark run for a command.
 */
export const recordBenchmark = async (
  command: string,
  testFile: string,
  testName: string,
  claudeOutput: string
): Promise<BenchmarkRun> => {
  const { usage, total, turnCount } = parseTokenUsage(claudeOutput);

  const run: BenchmarkRun = {
    timestamp: new Date().toISOString(),
    plugin_version: getPluginVersion(),
    test_file: testFile,
    test_name: testName,
    turn_count: turnCount,
    usage,
    total,
  };

  // Load existing data and append immutably
  const existingData = await loadBenchmarkData(command);
  const updatedData: BenchmarkData = { runs: [...existingData.runs, run] };
  await saveBenchmarkData(command, updatedData);

  return run;
};

/**
 * Get the relative test file path for benchmark recording.
 */
export const getTestFilePath = (absolutePath: string): string => {
  const testsIndex = absolutePath.indexOf('tests/');
  if (testsIndex === -1) return absolutePath;
  return absolutePath.slice(testsIndex);
};
