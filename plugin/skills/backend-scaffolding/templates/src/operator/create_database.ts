// Database: Connection factory
// Replace this implementation with your actual database client (pg, mysql2, etc.)
import type pino from "pino";

import type { Config } from "../config";

export type Database = {
  readonly connect: () => Promise<void>;
  readonly query: <T>(sql: string, params: unknown[]) => Promise<{ rows: T[] }>;
  readonly close: () => Promise<void>;
};

// In-memory store for development/testing
// Replace with actual database client in production
type StoredRow = Record<string, unknown>;
const tables = new Map<string, Map<string, StoredRow>>();

const getTable = (name: string): Map<string, StoredRow> => {
  if (!tables.has(name)) {
    tables.set(name, new Map());
  }
  return tables.get(name)!;
};

type DatabaseDependencies = Readonly<{
  readonly config: Config;
  readonly logger: pino.Logger;
}>;

export const createDatabase = (deps: DatabaseDependencies): Database => {
  const logger = deps.logger.child({ component: "database" });
  // TODO: Replace with actual database connection
  // Example with pg:
  // import { Pool } from 'pg';
  // const pool = new Pool({ connectionString: deps.config.databaseUrl });
  // return {
  //   query: <T>(sql: string, params: unknown[]) => pool.query(sql, params),
  //   close: () => pool.end(),
  // };

  return {
    connect: async () => {
      // TODO: Replace with actual database connection
      // Example: await pool.connect();
      logger.info("Database connected");
    },
    query: async <T>(sql: string, params: unknown[]): Promise<{ rows: T[] }> => {
      // Simple in-memory implementation for development
      // Supports basic INSERT...RETURNING and SELECT...WHERE id = $1
      const insertMatch = sql.match(/INSERT INTO (\w+)/i);
      const selectMatch = sql.match(/SELECT .+ FROM (\w+) WHERE id = \$1/i);

      if (insertMatch && insertMatch[1]) {
        const tableName = insertMatch[1];
        const table = getTable(tableName);
        const id = params[0] as string;
        const row: StoredRow = {
          id,
          name: params[1],
          message: params[2],
          created_at: params[3],
        };
        table.set(id, row);
        return { rows: [row as T] };
      }

      if (selectMatch && selectMatch[1]) {
        const tableName = selectMatch[1];
        const table = getTable(tableName);
        const id = params[0] as string;
        const row = table.get(id);
        return { rows: row ? [row as T] : [] };
      }

      return { rows: [] };
    },
    close: async () => {
      tables.clear();
    },
  };
};
