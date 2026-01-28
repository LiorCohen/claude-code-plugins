// Page: Greeter
// Create and view personalized greetings
import { useState } from 'react';
import { useCreateGreeting, useGreeting } from '../hooks';

export const GreeterPage = (): JSX.Element => {
  const [name, setName] = useState('');
  const [lastGreetingId, setLastGreetingId] = useState<string | null>(null);

  const createGreeting = useCreateGreeting();
  const { data: greeting } = useGreeting(lastGreetingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGreeting.mutate(
      { name: name.trim() },
      {
        onSuccess: (newGreeting) => {
          setLastGreetingId(newGreeting.id);
          setName('');
        },
      }
    );
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Greeter</h2>
      <p className="text-gray-600 mb-6">
        Enter a name to create a personalized greeting.
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={createGreeting.isPending || !name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {createGreeting.isPending ? 'Creating...' : 'Greet'}
          </button>
        </div>
        {createGreeting.isError && (
          <p className="mt-2 text-red-600">
            Error: {createGreeting.error.message}
          </p>
        )}
      </form>

      {greeting && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Your Greeting
          </h3>
          <p className="text-2xl text-blue-600 mb-4">{greeting.message}</p>
          <p className="text-sm text-gray-500">
            Created: {new Date(greeting.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">ID: {greeting.id}</p>
        </div>
      )}
    </div>
  );
};
