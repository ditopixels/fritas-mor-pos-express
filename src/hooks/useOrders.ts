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
  is_pending_payment?: boolean;
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

// Función para obtener todas las órdenes con paginación
const fetchAllOrders = async (): Promise<SupabaseOrder[]> => {
  let allOrders: SupabaseOrder[] = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allOrders = [...allOrders, ...data as SupabaseOrder[]];
      from += limit;
      
      // Si recibimos menos registros que el límite, no hay más datos
      hasMore = data.length === limit;
    } else {
      hasMore = false;
    }
  }

  console.log(`📦 Total órdenes cargadas: ${allOrders.length}`);
  return allOrders;
};

// Hook optimizado para cargar órdenes del mes actual inicialmente
export const useOrders = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Primero traer órdenes del mes actual
      const { data: currentMonthOrders, error: currentError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            sku,
            price,
            original_price,
            quantity,
            additional_selections,
            applied_promotions,
            variant_options,
            variant_attachments
          )
        `)
        .gte('created_at', startOfCurrentMonth.toISOString())
        .order('created_at', { ascending: false });

      if (currentError) throw currentError;

      // Si tenemos menos de 1000 órdenes del mes actual, traer más órdenes antiguas
      if (currentMonthOrders && currentMonthOrders.length < 1000) {
        const { data: olderOrders, error: olderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              variant_id,
              product_name,
              variant_name,
              sku,
              price,
              original_price,
              quantity,
              additional_selections,
              applied_promotions,
              variant_options,
              variant_attachments
            )
          `)
          .lt('created_at', startOfCurrentMonth.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000 - currentMonthOrders.length);

        if (olderError) throw olderError;

        return [...currentMonthOrders, ...(olderOrders || [])] as SupabaseOrder[];
      }

      return currentMonthOrders as SupabaseOrder[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
  });

  return { data: orders, isLoading };
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

      // Crear la orden con promociones aplicadas, campo is_delivery y status pendiente si aplica
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
          status: orderData.is_pending_payment ? 'payment-pending' : 'completed',
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
