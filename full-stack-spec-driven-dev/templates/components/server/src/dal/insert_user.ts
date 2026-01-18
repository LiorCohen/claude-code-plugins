// DAL: Insert user
// One function per file, receives dependencies as first argument
import type { User, CreateUserInput } from '../model';

export type InsertUserDeps = {
  readonly db: {
    readonly query: (sql: string, params: ReadonlyArray<unknown>) => Promise<{ readonly rows: ReadonlyArray<User> }>;
  };
};

export const insertUser = async (
  deps: InsertUserDeps,
  input: CreateUserInput
): Promise<User> => {
  const result = await deps.db.query(
    'INSERT INTO users (email, name, created_at) VALUES ($1, $2, NOW()) RETURNING id, email, name, created_at',
    [input.email, input.name]
  );
  return result.rows[0];
};
