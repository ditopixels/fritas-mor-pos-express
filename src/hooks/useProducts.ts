
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
  attachments?: ProductAttachment[];
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

export interface ProductAttachment {
  id: string;
  product_id?: string;
  name: string;
  values: string[];
  is_required: boolean;
  created_at?: string;
}

// Exportar tipo Promotion para evitar errores
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  applicability: 'all' | 'category' | 'product';
  target_id?: string;
  value: number;
  conditions: {
    daysOfWeek?: number[];
    startDate?: Date;
    endDate?: Date;
    paymentMethods?: string[];
    minimumPurchase?: number;
    minimumQuantity?: number;
  };
  is_active: boolean;
  created_at: string;
  minimum_quantity?: number;
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
          options:product_options(*),
          attachments:product_attachments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return data.map(product => ({
        ...product,
        options: product.options?.map(option => ({
          ...option,
          selection_type: option.selection_type || 'single'
        })) || [],
        attachments: product.attachments?.map(attachment => ({
          ...attachment,
          values: attachment.values || []
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
      console.log('🚀 useUpdateProduct - DATOS RECIBIDOS:', { 
        id, 
        updates,
        hasVariants: 'variants' in updates,
        hasAttachments: 'attachments' in updates,
        variantsValue: updates.variants,
        attachmentsValue: updates.attachments,
        variantsCount: updates.variants?.length || 0,
        attachmentsCount: updates.attachments?.length || 0
      });

      // Separar opciones, variantes y attachments del resto
      const { options, variants, attachments, ...productUpdates } = updates;
      
      // Actualizar producto básico primero
      const { data, error } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // PROCESAR OPCIONES
      if (options !== undefined) {
        console.log('🔧 PROCESANDO OPCIONES:', options.length);
        
        await supabase.from('product_options').delete().eq('product_id', id);

        if (options.length > 0) {
          const optionsToInsert = options.map(option => ({
            product_id: id,
            name: option.name,
            values: option.values,
            is_required: option.is_required,
            selection_type: option.selection_type || 'single',
          }));

          const { error: insertOptionsError } = await supabase
            .from('product_options')
            .insert(optionsToInsert);

          if (insertOptionsError) throw insertOptionsError;
        }
      }

      // PROCESAR ATTACHMENTS
      if (attachments !== undefined) {
        console.log('🔧 PROCESANDO ATTACHMENTS:', attachments.length);
        
        await supabase.from('product_attachments').delete().eq('product_id', id);

        if (attachments.length > 0) {
          const attachmentsToInsert = attachments.map(attachment => ({
            product_id: id,
            name: attachment.name,
            values: attachment.values,
            is_required: attachment.is_required,
          }));

          const { error: insertAttachmentsError } = await supabase
            .from('product_attachments')
            .insert(attachmentsToInsert);

          if (insertAttachmentsError) throw insertAttachmentsError;
        }
      }

      // PROCESAR VARIANTES
      if (variants !== undefined) {
        console.log('🔥 PROCESANDO VARIANTES - DATOS RECIBIDOS:', {
          variantsType: typeof variants,
          variantsIsArray: Array.isArray(variants),
          variantsLength: variants.length,
          variantsData: variants
        });
        
        // Eliminar variantes existentes
        await supabase.from('product_variants').delete().eq('product_id', id);

        // Insertar nuevas variantes si las hay
        if (variants.length > 0) {
          const variantsToInsert = variants.map(variant => ({
            product_id: id,
            name: variant.name,
            sku: variant.sku,
            price: Number(variant.price),
            option_values: variant.option_values || {},
            is_active: variant.is_active !== false,
            stock: variant.stock || null,
          }));

          console.log('📝 INSERTANDO VARIANTES:', variantsToInsert);

          const { error: insertVariantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);

          if (insertVariantsError) {
            console.error('❌ ERROR INSERTANDO VARIANTES:', insertVariantsError);
            throw insertVariantsError;
          }
          
          console.log('✅ VARIANTES GUARDADAS EXITOSAMENTE:', variantsToInsert.length);
        } else {
          console.log('ℹ️ NO HAY VARIANTES PARA INSERTAR');
        }
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
