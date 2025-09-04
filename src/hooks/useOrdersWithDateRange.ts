import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOrder } from './useOrders';

interface UseOrdersWithDateRangeProps {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export const useOrdersWithDateRange = ({ startDate, endDate, enabled = true }: UseOrdersWithDateRangeProps) => {
  return useQuery({
    queryKey: ['orders', 'dateRange', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<SupabaseOrder[]> => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            sku,
            price,
            original_price,
            quantity,
            additional_selections,
            applied_promotions,
            variant_options,
            variant_attachments
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros de fecha si están disponibles
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      // Función para obtener todas las órdenes con paginación si es necesario
      const fetchAllOrdersInRange = async (): Promise<SupabaseOrder[]> => {
        let allOrders: SupabaseOrder[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await query.range(from, from + limit - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allOrders = [...allOrders, ...data as SupabaseOrder[]];
            from += limit;
            
            // Si recibimos menos registros que el límite, no hay más datos
            hasMore = data.length === limit;
          } else {
            hasMore = false;
          }
        }

        console.log(`📦 Total órdenes cargadas para el rango de fechas: ${allOrders.length}`);
        return allOrders;
      };

      return await fetchAllOrdersInRange();
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};