'use client';

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid refetch storms during hydration; tune per feature via hooks.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  // Server: always a fresh client so requests never share cache across users.
  if (isServer) return makeQueryClient();
  // Browser: reuse a singleton so state survives suspense/re-renders.
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState (not useMemo) guarantees a stable client for the component's life.
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
