import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOrder } from './useOrders';

export const useOrdersCurrentMonth = () => {
  return useQuery({
    queryKey: ['orders', 'currentMonth'],
    queryFn: async (): Promise<SupabaseOrder[]> => {
      // Obtener primer día del mes actual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
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
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      // Función para obtener todas las órdenes del mes con paginación automática
      const fetchAllOrdersCurrentMonth = async (): Promise<SupabaseOrder[]> => {
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

        console.log(`📦 Total órdenes del mes actual cargadas: ${allOrders.length}`);
        return allOrders;
      };

      return await fetchAllOrdersCurrentMonth();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};