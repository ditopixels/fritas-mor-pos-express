
import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Hook optimizado para cargar múltiples recursos de una vez
export const useOptimizedPOSData = () => {
  const { user } = useAuth();

  return useQueries({
    queries: [
      {
        queryKey: ['categories'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          if (error) throw error;
          return data;
        },
        enabled: !!user, // Solo ejecutar si hay usuario autenticado
        staleTime: 10 * 60 * 1000, // 10 minutos para categorías
      },
      {
        queryKey: ['promotions'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
        enabled: !!user, // Solo ejecutar si hay usuario autenticado
        staleTime: 15 * 60 * 1000, // 15 minutos para promociones
      }
    ],
    combine: (results) => {
      return {
        data: {
          categories: results[0].data || [],
          promotions: results[1].data || [],
        },
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError),
        error: results.find(result => result.error)?.error,
      };
    },
  });
};

// Hook con cache local para productos por categoría
export const useOptimizedProducts = (selectedCategory: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_options(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!selectedCategory, // Solo fetch cuando hay usuario y categoría seleccionada
    staleTime: 8 * 60 * 1000, // 8 minutos
  });
};
