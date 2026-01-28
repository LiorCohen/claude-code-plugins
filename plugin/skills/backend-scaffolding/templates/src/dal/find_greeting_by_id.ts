// DAL: Find Greeting by ID
// Query function that retrieves a greeting from the database
import type { Greeting } from '../model/definitions';

export type FindGreetingByIdDeps = {
  readonly db: {
    readonly query: <T>(sql: string, params: unknown[]) => Promise<{ rows: T[] }>;
  };
};

type GreetingRow = {
  readonly id: string;
  readonly name: string;
  readonly message: string;
  readonly created_at: Date;
};

export const findGreetingById = async (
  deps: FindGreetingByIdDeps,
  id: string
): Promise<Greeting | null> => {
  const result = await deps.db.query<GreetingRow>(
    'SELECT id, name, message, created_at FROM greetings WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
};
