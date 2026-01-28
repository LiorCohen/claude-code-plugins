// Model Definition: Greeting
// Domain types imported from contract and adapted for the domain layer

import type { components } from '{{CONTRACT_PACKAGE}}';

type GreetingSchema = components['schemas']['Greeting'];
type CreateGreetingInputSchema = components['schemas']['CreateGreetingInput'];

// Domain layer uses Date objects instead of ISO strings from the API
export type Greeting = Omit<GreetingSchema, 'createdAt'> & {
  readonly createdAt: Date;
};

export type CreateGreetingInput = CreateGreetingInputSchema;
