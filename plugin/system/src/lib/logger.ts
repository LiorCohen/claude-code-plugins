/**
 * Logging utilities for the CLI.
 */

import type { GlobalOptions } from './args.js';

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
} as const;

export interface Logger {
  readonly info: (message: string, data?: unknown) => void;
  readonly success: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
  readonly debug: (message: string, data?: unknown) => void;
}

/**
 * Create a logger instance with the given options.
 */
export const createLogger = (options: GlobalOptions): Logger => {
  const { json, verbose } = options;

  const formatMessage = (
    level: string,
    color: string,
    message: string,
    data?: unknown
  ): string => {
    if (json) {
      return JSON.stringify({ level, message, ...(data ? { data } : {}) });
    }
    const prefix = `${color}[${level}]${COLORS.reset}`;
    const dataStr = data ? ` ${COLORS.gray}${JSON.stringify(data)}${COLORS.reset}` : '';
    return `${prefix} ${message}${dataStr}`;
  };

  return {
    info: (message: string, data?: unknown) => {
      console.log(formatMessage('INFO', COLORS.blue, message, data));
    },
    success: (message: string, data?: unknown) => {
      console.log(formatMessage('OK', COLORS.green, message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('WARN', COLORS.yellow, message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatMessage('ERROR', COLORS.red, message, data));
    },
    debug: (message: string, data?: unknown) => {
      if (verbose) {
        console.log(formatMessage('DEBUG', COLORS.gray, message, data));
      }
    },
  };
};

/**
 * Simple success/error output for CLI results (non-JSON mode).
 */
export const success = (message: string): void => {
  console.log(`${COLORS.green}✓${COLORS.reset} ${message}`);
};

export const error = (message: string): void => {
  console.error(`${COLORS.red}✗${COLORS.reset} ${message}`);
};
