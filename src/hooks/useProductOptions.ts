
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductOption, ProductVariant } from './useProducts';

export const useProductOptions = (productId: string) => {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      return data as ProductOption[];
    },
    enabled: !!productId,
  });
};

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });
};

export const useCreateProductOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optionData: {
      product_id: string;
      name: string;
      values: string[];
      is_required: boolean;
    }) => {
      const { data, error } = await supabase
        .from('product_options')
        .insert(optionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantData: {
      product_id: string;
      sku: string;
      name: string;
      price: number;
      option_values: Record<string, string>;
      is_active: boolean;
      stock?: number;
    }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variantData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useDeleteProductOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useBulkCreateProductVariants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variants: Array<{
      product_id: string;
      sku: string;
      name: string;
      price: number;
      option_values: Record<string, string>;
      is_active: boolean;
      stock?: number;
    }>) => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variants)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['product-variants', variables[0].product_id] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['all-products'] });
      }
    },
  });
};
