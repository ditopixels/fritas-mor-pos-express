
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Promotion } from '@/types';

export const usePromotions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(promotion => {
        const conditions = promotion.conditions as any || {};
        
        return {
          id: promotion.id,
          name: promotion.name,
          description: promotion.description,
          type: promotion.type as 'percentage' | 'fixed',
          value: promotion.value,
          applicability: promotion.applicability as 'all' | 'category' | 'product',
          target_id: promotion.target_id,
          conditions: {
            daysOfWeek: conditions.daysOfWeek || undefined,
            startDate: conditions.startDate ? new Date(conditions.startDate) : undefined,
            endDate: conditions.endDate ? new Date(conditions.endDate) : undefined,
            paymentMethods: conditions.paymentMethods || undefined,
            minimumPurchase: conditions.minimumPurchase || undefined,
            minimumQuantity: promotion.minimum_quantity || undefined,
          },
          is_active: promotion.is_active,
          created_at: promotion.created_at,
          minimum_quantity: promotion.minimum_quantity,
        };
      }) as Promotion[];
    },
    enabled: !!user,
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
      target_id?: string;
      conditions: {
        daysOfWeek?: number[];
        startDate?: Date;
        endDate?: Date;
        paymentMethods?: string[];
        minimumPurchase?: number;
        minimumQuantity?: number;
      };
      is_active: boolean;
    }) => {
      const conditionsJson = {
        daysOfWeek: promotionData.conditions.daysOfWeek,
        startDate: promotionData.conditions.startDate?.toISOString(),
        endDate: promotionData.conditions.endDate?.toISOString(),
        paymentMethods: promotionData.conditions.paymentMethods,
        minimumPurchase: promotionData.conditions.minimumPurchase,
      };

      const { data, error } = await supabase
        .from('promotions')
        .insert({
          name: promotionData.name,
          description: promotionData.description,
          type: promotionData.type,
          value: promotionData.value,
          applicability: promotionData.applicability,
          target_id: promotionData.target_id || null,
          conditions: conditionsJson,
          minimum_quantity: promotionData.conditions.minimumQuantity || 1,
          is_active: promotionData.is_active,
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
      const conditionsJson = updates.conditions ? {
        daysOfWeek: updates.conditions.daysOfWeek,
        startDate: updates.conditions.startDate instanceof Date ? updates.conditions.startDate.toISOString() : updates.conditions.startDate,
        endDate: updates.conditions.endDate instanceof Date ? updates.conditions.endDate.toISOString() : updates.conditions.endDate,
        paymentMethods: updates.conditions.paymentMethods,
        minimumPurchase: updates.conditions.minimumPurchase,
      } : undefined;

      const { data, error } = await supabase
        .from('promotions')
        .update({
          name: updates.name,
          description: updates.description,
          type: updates.type,
          value: updates.value,
          applicability: updates.applicability,
          target_id: updates.target_id || null,
          conditions: conditionsJson,
          minimum_quantity: updates.conditions?.minimumQuantity || 1,
          is_active: updates.is_active,
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
