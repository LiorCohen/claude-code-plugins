// Model Dependencies: Interface defining what use-cases need from DAL
// The Controller wires these when creating use-cases
import type { Greeting, CreateGreetingInput } from './definitions';

// Input for inserting a greeting includes the generated message
export type InsertGreetingInput = CreateGreetingInput & { readonly message: string };

export type Dependencies = {
  readonly findGreetingById: (id: string) => Promise<Greeting | null>;
  readonly insertGreeting: (input: InsertGreetingInput) => Promise<Greeting>;
};
