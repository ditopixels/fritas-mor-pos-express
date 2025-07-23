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
      return data as Product[];
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Product, 'options' | 'variants' | 'category'>> }) => {
      // Filtrar campos que no existen en la tabla products
      const { options, variants, category, ...productUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id)
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

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantData: {
      product_id: string;
      name: string;
      sku: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductVariant> }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductVariants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variants }: { productId: string; variants: ProductVariant[] }) => {
      // Obtener variantes existentes
      const { data: existingVariants, error: fetchError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (fetchError) throw fetchError;

      const existingVariantIds = existingVariants?.map(v => v.id) || [];
      const newVariantIds = variants.filter(v => !v.id.startsWith('temp-')).map(v => v.id);

      // Eliminar solo las variantes que ya no están en la lista y que no están referenciadas
      const variantsToDelete = existingVariantIds.filter(id => !newVariantIds.includes(id));
      
      if (variantsToDelete.length > 0) {
        // Verificar si alguna variante está siendo usada en órdenes
        const { data: referencedVariants, error: checkError } = await supabase
          .from('order_items')
          .select('variant_id')
          .in('variant_id', variantsToDelete);

        if (checkError) throw checkError;

        const referencedVariantIds = referencedVariants?.map(item => item.variant_id).filter(Boolean) || [];
        const safeToDelete = variantsToDelete.filter(id => !referencedVariantIds.includes(id));

        if (safeToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_variants')
            .delete()
            .in('id', safeToDelete);

          if (deleteError) throw deleteError;
        }
      }

      // Separar variantes para actualizar y crear
      const variantsToUpdate = variants.filter(v => !v.id.startsWith('temp-') && existingVariantIds.includes(v.id));
      const variantsToCreate = variants.filter(v => v.id.startsWith('temp-'));

      // Actualizar variantes existentes
      const updatePromises = variantsToUpdate.map(variant => 
        supabase
          .from('product_variants')
          .update({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            option_values: variant.option_values,
            is_active: variant.is_active,
            stock: variant.stock,
          })
          .eq('id', variant.id)
      );

      if (updatePromises.length > 0) {
        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults.filter(result => result.error);
        if (updateErrors.length > 0) {
          throw new Error('Error updating variants');
        }
      }

      // Crear nuevas variantes
      if (variantsToCreate.length > 0) {
        const variantsToInsert = variantsToCreate.map(variant => ({
          product_id: productId,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          option_values: variant.option_values,
          is_active: variant.is_active,
          stock: variant.stock,
        }));

        const { data: newVariants, error: insertError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)
          .select();

        if (insertError) throw insertError;
        return newVariants;
      }

      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
