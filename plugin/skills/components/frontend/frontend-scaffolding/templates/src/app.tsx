import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components';
import { HomePage } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const PageRouter = ({ currentPage }: { currentPage: string }): JSX.Element => {
  switch (currentPage) {
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
