
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedCategories = () => {
  return useQuery({
    queryKey: ['optimized-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useOptimizedProducts = () => {
  return useQuery({
    queryKey: ['optimized-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_options(*),
          product_attachments(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useOptimizedPOSData = () => {
  return useQuery({
    queryKey: ['pos-data'],
    queryFn: async () => {
      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch products with all related data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_options(*),
          product_attachments(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (productsError) throw productsError;

      // Fetch promotions
      const { data: promotions, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true);

      if (promotionsError) throw promotionsError;

      return {
        categories: categories || [],
        products: products || [],
        promotions: promotions || []
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
