// DAL: Find user by email
// One function per file, receives dependencies as first argument
import type { User } from '../model';

export type FindUserByEmailDeps = {
  readonly db: {
    readonly query: (sql: string, params: ReadonlyArray<unknown>) => Promise<{ readonly rows: ReadonlyArray<User> }>;
  };
};

export const findUserByEmail = async (
  deps: FindUserByEmailDeps,
  email: string
): Promise<User | null> => {
  const result = await deps.db.query(
    'SELECT id, email, name, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
};
