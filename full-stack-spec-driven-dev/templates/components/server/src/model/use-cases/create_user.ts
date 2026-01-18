// Use case: Create user
// One function per file, receives Dependencies as first argument
import type { User } from '../definitions';
import type { Dependencies } from '../dependencies';

export type CreateUserArgs = {
  readonly email: string;
  readonly name: string;
};

export type CreateUserResult =
  | { readonly success: true; readonly user: User }
  | { readonly success: false; readonly error: 'email_exists' };

export const createUser = async (
  deps: Dependencies,
  args: CreateUserArgs
): Promise<CreateUserResult> => {
  const existingUser = await deps.findUserByEmail(args.email);

  if (existingUser) {
    return { success: false, error: 'email_exists' };
  }

  const newUser = await deps.insertUser({
    email: args.email,
    name: args.name,
  });

  return { success: true, user: newUser };
};
