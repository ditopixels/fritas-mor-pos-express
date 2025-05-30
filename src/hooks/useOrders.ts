
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, AppliedPromotion } from '@/types';

export interface CreateOrderData {
  customer_name: string;
  payment_method: string;
  cash_received?: number;
  photo_evidence?: string;
  items: CartItem[];
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
  order_items?: {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    price: number;
    original_price?: number;
    quantity: number;
    applied_promotions?: any;
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

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total_discount = 0; // Por ahora sin descuentos
      const total = subtotal - total_discount;

      // Crear la orden
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
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden - convertir applied_promotions a JSON
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        variant_id: item.id, // Asumiendo que usamos el mismo ID por ahora
        product_name: item.productName,
        variant_name: item.variantName,
        sku: item.sku,
        price: item.price,
        original_price: item.originalPrice || item.price,
        quantity: item.quantity,
        applied_promotions: JSON.stringify(item.appliedPromotions || []),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
