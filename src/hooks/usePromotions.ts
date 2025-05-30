
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Promotion } from '@/types';

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(promotion => ({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type as 'percentage' | 'fixed',
        value: promotion.value,
        applicability: promotion.applicability as 'all' | 'category' | 'product',
        conditions: promotion.conditions || {},
        isActive: promotion.is_active,
        createdAt: new Date(promotion.created_at),
      })) as Promotion[];
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotionData: {
      name: string;
      description?: string;
      type: 'percentage' | 'fixed';
      value: number;
      applicability: 'all' | 'category' | 'product';
      conditions: object;
      isActive: boolean;
    }) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          name: promotionData.name,
          description: promotionData.description,
          type: promotionData.type,
          value: promotionData.value,
          applicability: promotionData.applicability,
          conditions: JSON.stringify(promotionData.conditions),
          is_active: promotionData.isActive,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Promotion> }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update({
          name: updates.name,
          description: updates.description,
          type: updates.type,
          value: updates.value,
          applicability: updates.applicability,
          conditions: updates.conditions ? JSON.stringify(updates.conditions) : undefined,
          is_active: updates.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
};
