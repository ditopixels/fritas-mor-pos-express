
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOrder } from './useOrders';

// Hook optimizado para órdenes con estado local
export const useOptimizedOrders = (limit: number = 25) => {
  const queryClient = useQueryClient();
  const [localOrders, setLocalOrders] = useState<SupabaseOrder[]>([]);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Consulta inicial solo una vez
  const query = useQuery({
    queryKey: ['orders', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Actualizar estado local con datos iniciales
      if (!hasInitialLoad) {
        setLocalOrders(data as SupabaseOrder[]);
        setHasInitialLoad(true);
      }
      
      return data as SupabaseOrder[];
    },
    staleTime: Infinity, // No refetch automático
    gcTime: Infinity, // Mantener en cache indefinidamente
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Función para agregar nueva orden al estado local
  const addOrderToLocal = useCallback((newOrder: SupabaseOrder) => {
    setLocalOrders(prevOrders => [newOrder, ...prevOrders]);
  }, []);

  // Función para forzar recarga si es necesario
  const forceRefresh = useCallback(() => {
    setHasInitialLoad(false);
    queryClient.invalidateQueries({ queryKey: ['orders', 'optimized'] });
  }, [queryClient]);

  return {
    data: hasInitialLoad ? localOrders : query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    addOrderToLocal,
    forceRefresh,
  };
};
