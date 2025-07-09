
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, AppliedPromotion } from '@/types';

export interface CreateOrderData {
  customer_name: string;
  payment_method: string;
  cash_received?: number;
  photo_evidence?: string;
  items: CartItem[];
  is_delivery?: boolean;
}

// Definir el tipo que viene de Supabase
export interface SupabaseOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  payment_method: string;
  created_at: string;
  status: string;
  subtotal: number;
  total_discount: number;
  cash_received?: number;
  photo_evidence?: string;
  applied_promotions?: any;
  is_delivery?: boolean;
  cancellation_reason?: string;
  order_items?: {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    price: number;
    original_price?: number;
    quantity: number;
    applied_promotions?: any;
    additional_selections?: string;
  }[];
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupabaseOrder[];
    },
  });
};

export const useCreateOrder = (onOrderCreated?: (order: SupabaseOrder) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      const subtotal = orderData.items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
      const total_discount = orderData.items.reduce((sum, item) => {
        if (item.appliedPromotions && item.originalPrice) {
          const itemDiscount = item.appliedPromotions.reduce((acc, promo) => acc + promo.discountAmount, 0);
          return sum + (itemDiscount * item.quantity);
        }
        return sum;
      }, 0);
      const total = subtotal - total_discount;

      // Crear la orden con promociones aplicadas y campo is_delivery
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: `ORD-${Date.now()}`,
          customer_name: orderData.customer_name,
          user_id: user.data.user.id,
          subtotal,
          total_discount,
          total,
          payment_method: orderData.payment_method,
          cash_received: orderData.cash_received,
          photo_evidence: orderData.photo_evidence,
          applied_promotions: JSON.stringify(orderData.items.flatMap(item => item.appliedPromotions || [])),
          is_delivery: orderData.is_delivery || false,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden con información completa de promociones y salsas
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        variant_id: item.variantId && item.variantId !== item.id ? item.variantId : null,
        product_name: item.productName,
        variant_name: item.variantName,
        sku: item.sku,
        price: item.price,
        original_price: item.originalPrice || item.price,
        quantity: item.quantity,
        applied_promotions: JSON.stringify(item.appliedPromotions || []),
        variant_options: JSON.stringify({}), // Por ahora vacío, se llenará con las opciones seleccionadas
        additional_selections: item.selectedSauces ? JSON.stringify(item.selectedSauces) : null,
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Crear objeto completo de orden para retornar
      const completeOrder: SupabaseOrder = {
        ...order,
        order_items: createdItems.map(item => ({
          id: item.id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          sku: item.sku,
          price: item.price,
          original_price: item.original_price,
          quantity: item.quantity,
          applied_promotions: item.applied_promotions,
          additional_selections: item.additional_selections,
        }))
      };

      // Llamar callback si existe (para agregar al estado local)
      if (onOrderCreated) {
        onOrderCreated(completeOrder);
      }

      return completeOrder;
    },
    onSuccess: () => {
      // Solo invalidar queries específicas si es necesario
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
