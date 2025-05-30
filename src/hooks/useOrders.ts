
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types';

export interface CreateOrderData {
  customer_name: string;
  payment_method: string;
  cash_received?: number;
  photo_evidence?: string;
  items: CartItem[];
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
      return data;
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

      // Crear los items de la orden
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
        applied_promotions: item.appliedPromotions || [],
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
