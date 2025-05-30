
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
      
      if (promotion.conditions.startDate && now < promotion.conditions.startDate) return false;
      if (promotion.conditions.endDate && now > promotion.conditions.endDate) return false;
      
      if (promotion.conditions.daysOfWeek && 
          promotion.conditions.daysOfWeek.length > 0 && 
          !promotion.conditions.daysOfWeek.includes(currentDay)) {
        return false;
      }
      
      return true;
    });
  }, [promotions]);

  const calculateItemPromotions = (productId: string, categoryId: string, price: number) => {
    const appliedPromotions: AppliedPromotion[] = [];

    const eligiblePromotions = activePromotions.filter(promo => {
      // Solo mostrar promociones sin compra mínima y sin cantidad mínima en productos individuales
      if (promo.conditions.minimumPurchase && promo.conditions.minimumPurchase > 0) {
        return false;
      }
      if (promo.conditions.minimumQuantity && promo.conditions.minimumQuantity > 1) {
        return false;
      }
      return true;
    });

    eligiblePromotions.forEach(promotion => {
      let isApplicable = false;

      if (promotion.applicability === 'all') {
        isApplicable = true;
      } else if (promotion.applicability === 'category') {
        isApplicable = promotion.targetIds?.includes(categoryId) || false;
      } else if (promotion.applicability === 'product') {
        isApplicable = promotion.targetIds?.includes(productId) || false;
      }

      if (isApplicable) {
        let discountAmount = 0;

        if (promotion.type === 'percentage') {
          discountAmount = (price * promotion.value) / 100;
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
        }
      }
    });

    return appliedPromotions;
  };

  const calculatePromotions = (cartItems: CartItem[], subtotal: number) => {
    const appliedPromotions: AppliedPromotion[] = [];
    let totalDiscount = 0;
    const updatedItems = [...cartItems];

    // Verificar promociones de compra mínima y cantidad mínima
    const eligiblePromotions = activePromotions.filter(promo => {
      if (promo.conditions.minimumPurchase && subtotal < promo.conditions.minimumPurchase) {
        return false;
      }
      
      // Verificar cantidad mínima
      if (promo.conditions.minimumQuantity && promo.conditions.minimumQuantity > 1) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < promo.conditions.minimumQuantity) {
          return false;
        }
      }
      
      return true;
    });

    eligiblePromotions.forEach(promotion => {
      let discountAmount = 0;
      const affectedItems: CartItem[] = [];

      if (promotion.applicability === 'all') {
        affectedItems.push(...updatedItems);
      } else if (promotion.applicability === 'category') {
        affectedItems.push(
          ...updatedItems.filter(item => 
            promotion.targetIds?.some(targetId => 
              item.id === targetId
            )
          )
        );
      } else if (promotion.applicability === 'product') {
        affectedItems.push(
          ...updatedItems.filter(item => 
            promotion.targetIds?.includes(item.id)
          )
        );
      }

      if (affectedItems.length > 0) {
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
    calculateItemPromotions,
  };
};
