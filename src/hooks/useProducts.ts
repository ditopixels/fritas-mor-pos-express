
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  image?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  options: ProductOption[];
  variants: ProductVariant[];
  category?: {
    id: string;
    name: string;
  };
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  is_required: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  option_values: Record<string, string>;
  is_active: boolean;
  stock?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_options(*),
          product_variants(*)
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      return products.map(product => ({
        ...product,
        options: product.product_options || [],
        variants: product.product_variants || [],
      })) as Product[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useAllProducts = () => {
  return useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_options(*),
          product_variants(*)
        `)
        .order('display_order');

      if (error) throw error;

      return products.map(product => ({
        ...product,
        options: product.product_options || [],
        variants: product.product_variants || [],
      })) as Product[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: {
      name: string;
      description?: string;
      image?: string;
      is_active: boolean;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Solo desactivar la categoría, no eliminarla
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: {
      name: string;
      description?: string;
      category_id: string;
      image?: string;
      is_active: boolean;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Solo desactivar el producto, no eliminarlo
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};

export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
};

export const useUpdateProductOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('products')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    },
  });
};
