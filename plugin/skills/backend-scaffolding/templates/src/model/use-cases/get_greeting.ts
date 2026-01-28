// Use Case: Get Greeting
// Retrieves a previously created greeting by ID
import type { Dependencies } from '../dependencies';
import type { Greeting } from '../definitions';

export const getGreeting = async (
  deps: Dependencies,
  id: string
): Promise<Greeting | null> => {
  return deps.findGreetingById(id);
};
