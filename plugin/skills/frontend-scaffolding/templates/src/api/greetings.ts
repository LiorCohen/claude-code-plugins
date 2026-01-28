// Model: Greetings API
// API layer for greeting operations - types from OpenAPI contract
import type { components } from '{{CONTRACT_PACKAGE}}';

const API_BASE = '/api/v1';

export type Greeting = components['schemas']['Greeting'];
export type CreateGreetingInput = components['schemas']['CreateGreetingInput'];

export type ApiError = {
  readonly error: components['schemas']['Error'];
};

export const greetingsApi = {
  create: async (input: CreateGreetingInput): Promise<Greeting> => {
    const response = await fetch(`${API_BASE}/greetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  },

  getById: async (id: string): Promise<Greeting> => {
    const response = await fetch(`${API_BASE}/greetings/${id}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  },
};
