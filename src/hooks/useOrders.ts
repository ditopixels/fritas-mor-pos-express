
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

// Define the type that comes from Supabase
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
    variant_options?: any;
    variant_attachments?: any;
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

      console.log('🛒 Creating order with items:', orderData.items);

      // Create order with applied promotions
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
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with complete information of promotions, options and attachments
      const orderItems = orderData.items.map(item => {
        console.log('🔍 Processing item for order:', item.productName, 'Options:', item.selectedOptions, 'Attachments:', item.selectedAttachments);
        
        return {
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
          variant_options: JSON.stringify(item.selectedOptions || {}),
          variant_attachments: JSON.stringify(item.selectedAttachments || {}),
        };
      });

      console.log('💾 Saving order items with options and attachments:', orderItems);

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      console.log('✅ Order items saved successfully:', createdItems);

      // Create complete order object to return
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
          variant_options: item.variant_options,
          variant_attachments: item.variant_attachments,
        }))
      };

      // Call callback if exists (to add to local state)
      if (onOrderCreated) {
        onOrderCreated(completeOrder);
      }

      return completeOrder;
    },
    onSuccess: () => {
      // Only invalidate specific queries if necessary
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
