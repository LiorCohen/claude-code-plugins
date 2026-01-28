// DAL: Insert Greeting
// Mutation function that creates a new greeting in the database
import { randomUUID } from "node:crypto";

import type { Greeting, CreateGreetingInput } from '../model/definitions';

export type InsertGreetingDeps = {
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

export const insertGreeting = async (
  deps: InsertGreetingDeps,
  input: CreateGreetingInput & { readonly message: string }
): Promise<Greeting> => {
  const id = randomUUID();
  const now = new Date();

  const result = await deps.db.query<GreetingRow>(
    `INSERT INTO greetings (id, name, message, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, message, created_at`,
    [id, input.name, input.message, now]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Insert failed: no row returned');
  }

  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
};
