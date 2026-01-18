// Dependencies interface - defines what Model use-cases need from outside
import type { User, CreateUserInput } from './definitions';

export type Dependencies = {
  readonly findUserByEmail: (email: string) => Promise<User | null>;
  readonly insertUser: (input: CreateUserInput) => Promise<User>;
};
