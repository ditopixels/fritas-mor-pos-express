
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SupabaseOrder } from './useOrders';

// Hook optimizado para órdenes de las últimas 14 horas
export const useOptimizedOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localOrders, setLocalOrders] = useState<SupabaseOrder[]>([]);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Calcular fecha de hace 14 horas
  const fourteenHoursAgo = new Date(Date.now() - 14 * 60 * 60 * 1000);

  // Consulta inicial solo una vez y solo si está autenticado
  const query = useQuery({
    queryKey: ['orders', 'optimized', 'last14hours'],
    queryFn: async () => {
      console.log('📅 Cargando órdenes de las últimas 14 horas desde:', fourteenHoursAgo.toISOString());
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .gte('created_at', fourteenHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📦 Órdenes cargadas:', data?.length || 0);
      
      // Actualizar estado local con datos iniciales
      if (!hasInitialLoad) {
        setLocalOrders(data as SupabaseOrder[]);
        setHasInitialLoad(true);
      }
      
      return data as SupabaseOrder[];
    },
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
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
    queryClient.invalidateQueries({ queryKey: ['orders', 'optimized', 'last14hours'] });
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
