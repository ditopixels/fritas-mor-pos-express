
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOrder } from './useOrders';

// Hook para cargar órdenes de forma incremental
export const useIncrementalOrders = (limit: number = 20) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orders', 'incremental', limit],
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
      return data as SupabaseOrder[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos para órdenes
  });

  // Prefetch de la siguiente página cuando los datos están disponibles
  useEffect(() => {
    if (query.data && query.data.length === limit) {
      // Prefetch siguiente página
      queryClient.prefetchQuery({
        queryKey: ['orders', 'incremental', limit + 10],
        queryFn: async () => {
          const { data: nextData, error } = await supabase
            .from('orders')
            .select(`*, order_items(*)`)
            .order('created_at', { ascending: false })
            .limit(limit + 10);
          if (error) throw error;
          return nextData;
        },
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [query.data, limit, queryClient]);

  return query;
};
