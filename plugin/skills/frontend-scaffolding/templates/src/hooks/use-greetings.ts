// ViewModel: useGreetings hook
// Encapsulates greeting state and operations using TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { greetingsApi, type CreateGreetingInput, type Greeting } from '../api';

// Query key factory for type-safe cache management
const greetingKeys = {
  all: ['greetings'] as const,
  detail: (id: string) => ['greetings', id] as const,
};

// Hook to fetch a greeting by ID
export const useGreeting = (id: string | null) => {
  return useQuery({
    queryKey: greetingKeys.detail(id ?? ''),
    queryFn: () => greetingsApi.getById(id!),
    enabled: !!id,
  });
};

// Hook to create a new greeting
export const useCreateGreeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGreetingInput) => greetingsApi.create(input),
    onSuccess: (greeting: Greeting) => {
      // Cache the newly created greeting
      queryClient.setQueryData(greetingKeys.detail(greeting.id), greeting);
    },
  });
};
