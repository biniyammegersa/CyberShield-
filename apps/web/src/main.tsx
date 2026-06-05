import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './app/store';
import { AppRouter } from './app/router';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { ThemeProvider } from './lib/theme';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthBootstrap>
            <AppRouter />
          </AuthBootstrap>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
