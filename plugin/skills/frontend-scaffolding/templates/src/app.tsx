import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components';
import { HomePage, GreeterPage } from './pages';

// Create a single QueryClient instance for the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Simple page router based on current page state
const PageRouter = ({ currentPage }: { currentPage: string }): JSX.Element => {
  switch (currentPage) {
    case 'greeter':
      return <GreeterPage />;
    case 'home':
    default:
      return <HomePage />;
  }
};

export const App = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1">
          <PageRouter currentPage={currentPage} />
        </main>
      </div>
    </QueryClientProvider>
  );
};
