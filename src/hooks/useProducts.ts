import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  image?: string;
  base_price?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  category?: Category;
  variants?: ProductVariant[];
  options?: ProductOption[];
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

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  is_required: boolean;
  selection_type: 'single' | 'multiple';
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  option_values: Record<string, string>;
  is_active: boolean;
  stock?: number;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*),
          options:product_options(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return data.map(product => ({
        ...product,
        options: product.options?.map(option => ({
          ...option,
          selection_type: option.selection_type || 'single'
        })) || []
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
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

// Alias para compatibilidad
export const useAllProducts = useProducts;
export const useAllCategories = useCategories;

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: {
      name: string;
      description?: string;
      category_id: string;
      image?: string;
      base_price?: number;
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
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      // Separar las opciones y variantes del resto de updates
      const { options, variants, ...productUpdates } = updates;
      
      // Actualizar el producto
      const { data, error } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Si hay opciones, eliminar las existentes y crear las nuevas
      if (options && options.length > 0) {
        // Eliminar opciones existentes
        await supabase
          .from('product_options')
          .delete()
          .eq('product_id', id);

        // Insertar nuevas opciones
        const optionsToInsert = options.map(option => ({
          product_id: id,
          name: option.name,
          values: option.values,
          is_required: option.is_required,
          selection_type: option.selection_type,
        }));

        await supabase
          .from('product_options')
          .insert(optionsToInsert);
      }

      // Si hay variantes, eliminar las existentes y crear las nuevas
      if (variants && variants.length > 0) {
        // Eliminar variantes existentes
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', id);

        // Insertar nuevas variantes
        const variantsToInsert = variants.map(variant => ({
          product_id: id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          option_values: variant.option_values,
          is_active: variant.is_active,
          stock: variant.stock,
        }));

        await supabase
          .from('product_variants')
          .insert(variantsToInsert);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: { id: string; display_order: number }[]) => {
      const promises = categories.map(category =>
        supabase
          .from('categories')
          .update({ display_order: category.display_order })
          .eq('id', category.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Error updating category order');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateProductOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: { id: string; display_order: number }[]) => {
      const promises = products.map(product =>
        supabase
          .from('products')
          .update({ display_order: product.display_order })
          .eq('id', product.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Error updating product order');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCreateProductOptions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: { productId: string; options: Omit<ProductOption, 'id' | 'product_id' | 'created_at'>[] }) => {
      const { data, error } = await supabase
        .from('product_options')
        .insert(
          options.options.map(option => ({
            product_id: options.productId,
            name: option.name,
            values: option.values,
            is_required: option.is_required,
            selection_type: option.selection_type,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCreateProductVariants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variants: { productId: string; variants: Omit<ProductVariant, 'id' | 'product_id'>[] }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(
          variants.variants.map(variant => ({
            product_id: variants.productId,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            option_values: variant.option_values,
            is_active: variant.is_active,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
