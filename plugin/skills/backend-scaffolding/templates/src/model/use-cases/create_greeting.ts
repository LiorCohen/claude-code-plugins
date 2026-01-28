// Use Case: Create Greeting
// Generates a personalized greeting message and persists it
import type { Dependencies } from '../dependencies';
import type { Greeting, CreateGreetingInput } from '../definitions';

export const createGreeting = async (
  deps: Dependencies,
  input: CreateGreetingInput
): Promise<Greeting> => {
  // Generate the greeting message
  const greetingInput = {
    ...input,
    message: `Hello, ${input.name}!`,
  };

  // Persist and return the greeting
  return deps.insertGreeting(greetingInput);
};
