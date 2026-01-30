/**
 * Argument parsing utilities for the CLI.
 */

export interface GlobalOptions {
  readonly json: boolean;
  readonly verbose: boolean;
  readonly help: boolean;
}

export interface ParsedArgs {
  readonly namespace: string | undefined;
  readonly action: string | undefined;
  readonly args: readonly string[];
  readonly options: GlobalOptions;
}

export interface CommandResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly message?: string;
}

/**
 * Parse command line arguments into structured format.
 */
export const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const args: string[] = [];
  const options: GlobalOptions = {
    json: false,
    verbose: false,
    help: false,
  };

  let namespace: string | undefined;
  let action: string | undefined;
  let i = 0;

  // First pass: extract namespace and action
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg) {
      i++;
      continue;
    }

    if (arg.startsWith('--')) {
      // Handle options
      switch (arg) {
        case '--json':
          (options as { json: boolean }).json = true;
          break;
        case '--verbose':
          (options as { verbose: boolean }).verbose = true;
          break;
        case '--help':
        case '-h':
          (options as { help: boolean }).help = true;
          break;
        default:
          // Pass through other options as args
          args.push(arg);
          // Check if next arg is a value for this option
          if (i + 1 < argv.length && argv[i + 1] && !argv[i + 1]?.startsWith('-')) {
            args.push(argv[i + 1] ?? '');
            i++;
          }
      }
    } else if (!namespace) {
      namespace = arg;
    } else if (!action) {
      action = arg;
    } else {
      args.push(arg);
    }
    i++;
  }

  return { namespace, action, args, options };
};

/**
 * Parse named arguments from an array of strings.
 * Supports: --key value and positional arguments.
 */
export const parseNamedArgs = (
  args: readonly string[]
): { named: Readonly<Record<string, string>>; positional: readonly string[] } => {
  const named: Record<string, string> = {};
  const positional: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg) {
      i++;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        named[key] = nextArg;
        i += 2;
      } else {
        named[key] = 'true';
        i++;
      }
    } else {
      positional.push(arg);
      i++;
    }
  }

  return { named, positional };
};

/**
 * Output a command result, respecting JSON mode.
 */
export const outputResult = (result: CommandResult, options: GlobalOptions): void => {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!result.success && result.error) {
    console.error(`Error: ${result.error}`);
  } else if (result.message) {
    console.log(result.message);
  }
};
