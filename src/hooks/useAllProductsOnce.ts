
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook que carga todos los productos una sola vez y permite filtrado local
export const useAllProductsOnce = () => {
  return useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_options(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - más tiempo que antes
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
  });
};

// Hook que filtra productos por categoría localmente
export const useFilteredProducts = (selectedCategory: string, allProducts: any[] = []) => {
  if (!selectedCategory) return allProducts;
  return allProducts.filter(product => product.category_id === selectedCategory);
};
