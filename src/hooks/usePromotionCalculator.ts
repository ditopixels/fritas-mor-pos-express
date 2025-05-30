
import { useMemo } from 'react';
import { CartItem, Promotion, AppliedPromotion } from '@/types';
import { usePromotions } from './usePromotions';

export const usePromotionCalculator = () => {
  const { data: promotions = [] } = usePromotions();

  const activePromotions = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    
    return promotions.filter(promotion => {
      if (!promotion.isActive) return false;
      
      // Verificar fechas
      if (promotion.conditions.startDate && now < promotion.conditions.startDate) return false;
      if (promotion.conditions.endDate && now > promotion.conditions.endDate) return false;
      
      // Verificar días de la semana
      if (promotion.conditions.daysOfWeek && 
          promotion.conditions.daysOfWeek.length > 0 && 
          !promotion.conditions.daysOfWeek.includes(currentDay)) {
        return false;
      }
      
      return true;
    });
  }, [promotions]);

  const calculatePromotions = (cartItems: CartItem[], subtotal: number) => {
    const appliedPromotions: AppliedPromotion[] = [];
    let totalDiscount = 0;
    const updatedItems = [...cartItems];

    // Verificar promoción de compra mínima
    const eligiblePromotions = activePromotions.filter(promo => {
      if (promo.conditions.minimumPurchase && subtotal < promo.conditions.minimumPurchase) {
        return false;
      }
      return true;
    });

    eligiblePromotions.forEach(promotion => {
      let discountAmount = 0;
      const affectedItems: CartItem[] = [];

      if (promotion.applicability === 'all') {
        // Aplicar a todos los productos
        affectedItems.push(...updatedItems);
      } else if (promotion.applicability === 'category') {
        // Aplicar a productos de categorías específicas
        affectedItems.push(
          ...updatedItems.filter(item => 
            promotion.targetIds?.some(targetId => 
              // Aquí necesitarías verificar la categoría del producto
              // Por ahora asumimos que tienes esta información
              item.id === targetId
            )
          )
        );
      } else if (promotion.applicability === 'product') {
        // Aplicar a productos específicos
        affectedItems.push(
          ...updatedItems.filter(item => 
            promotion.targetIds?.includes(item.id)
          )
        );
      }

      if (affectedItems.length > 0) {
        // Calcular descuento
        if (promotion.type === 'percentage') {
          const itemsSubtotal = affectedItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
          );
          discountAmount = (itemsSubtotal * promotion.value) / 100;
        } else {
          discountAmount = promotion.value;
        }

        if (discountAmount > 0) {
          appliedPromotions.push({
            promotionId: promotion.id,
            promotionName: promotion.name,
            type: promotion.type,
            value: promotion.value,
            discountAmount,
          });

          totalDiscount += discountAmount;

          // Aplicar descuento a los items afectados
          affectedItems.forEach(item => {
            const itemIndex = updatedItems.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
              const itemDiscount = promotion.type === 'percentage' 
                ? (item.price * promotion.value) / 100
                : promotion.value / affectedItems.length;
              
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                originalPrice: updatedItems[itemIndex].originalPrice || updatedItems[itemIndex].price,
                price: Math.max(0, updatedItems[itemIndex].price - itemDiscount),
                appliedPromotions: [
                  ...(updatedItems[itemIndex].appliedPromotions || []),
                  {
                    promotionId: promotion.id,
                    promotionName: promotion.name,
                    type: promotion.type,
                    value: promotion.value,
                    discountAmount: itemDiscount,
                  }
                ]
              };
            }
          });
        }
      }
    });

    return {
      updatedItems,
      appliedPromotions,
      totalDiscount,
      newSubtotal: subtotal - totalDiscount,
    };
  };

  return {
    activePromotions,
    calculatePromotions,
  };
};
