
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
      
      return data.map(promotion => {
        // Safely parse the conditions JSON
        const conditions = promotion.conditions as any || {};
        
        return {
          id: promotion.id,
          name: promotion.name,
          description: promotion.description,
          type: promotion.type as 'percentage' | 'fixed',
          value: promotion.value,
          applicability: promotion.applicability as 'all' | 'category' | 'product',
          targetIds: promotion.target_id ? [promotion.target_id] : undefined,
          conditions: {
            daysOfWeek: conditions.daysOfWeek || undefined,
            startDate: conditions.startDate ? new Date(conditions.startDate) : undefined,
            endDate: conditions.endDate ? new Date(conditions.endDate) : undefined,
            paymentMethods: conditions.paymentMethods || undefined,
            minimumPurchase: conditions.minimumPurchase || undefined,
            minimumQuantity: promotion.minimum_quantity || undefined,
          },
          isActive: promotion.is_active,
          createdAt: new Date(promotion.created_at),
        };
      }) as Promotion[];
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
      targetIds?: string[];
      conditions: {
        daysOfWeek?: number[];
        startDate?: Date;
        endDate?: Date;
        paymentMethods?: string[];
        minimumPurchase?: number;
        minimumQuantity?: number;
      };
      isActive: boolean;
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
          target_id: promotionData.targetIds?.[0] || null,
          conditions: conditionsJson,
          minimum_quantity: promotionData.conditions.minimumQuantity || 1,
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
          target_id: updates.targetIds?.[0] || null,
          conditions: conditionsJson,
          minimum_quantity: updates.conditions?.minimumQuantity || 1,
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
