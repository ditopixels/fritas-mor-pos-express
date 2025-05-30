
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aumentar staleTime para reducir refetches automáticos
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Mantener datos en cache más tiempo
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
      // Reducir refetches en focus/reconnect
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Retry menos agresivo
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
