import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from './useExpenses';

interface UseExpensesWithDateRangeProps {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export const useExpensesWithDateRange = ({ startDate, endDate, enabled = true }: UseExpensesWithDateRangeProps) => {
  return useQuery({
    queryKey: ['expenses', 'dateRange', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<Expense[]> => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros de fecha si están disponibles
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      // Función para obtener todos los gastos con paginación si es necesario
      const fetchAllExpensesInRange = async (): Promise<Expense[]> => {
        let allExpenses: Expense[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await query.range(from, from + limit - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allExpenses = [...allExpenses, ...data as Expense[]];
            from += limit;
            
            // Si recibimos menos registros que el límite, no hay más datos
            hasMore = data.length === limit;
          } else {
            hasMore = false;
          }
        }

        console.log(`💰 Total gastos cargados para el rango de fechas: ${allExpenses.length}`);
        return allExpenses;
      };

      return await fetchAllExpensesInRange();
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};