// DAL: Find user by ID
// One function per file, receives dependencies as first argument
import type { User } from '../model';

export type FindUserByIdDeps = {
  readonly db: {
    readonly query: (sql: string, params: ReadonlyArray<unknown>) => Promise<{ readonly rows: ReadonlyArray<User> }>;
  };
};

export const findUserById = async (
  deps: FindUserByIdDeps,
  id: string
): Promise<User | null> => {
  const result = await deps.db.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
};
