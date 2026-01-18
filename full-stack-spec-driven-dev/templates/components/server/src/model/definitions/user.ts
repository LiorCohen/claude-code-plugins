// Model definitions - TypeScript types ONLY (no Zod/validation)
// Validation belongs in the Controller layer (input) or Server layer (middleware)

export type User = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
};

export type CreateUserInput = {
  readonly email: string;
  readonly name: string;
};
