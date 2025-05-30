
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

    // Agrupar items por producto para verificar cantidad mínima
    const itemsByProduct = cartItems.reduce((acc, item) => {
      const productId = item.id;
      if (!acc[productId]) {
        acc[productId] = { items: [], totalQuantity: 0 };
      }
      acc[productId].items.push(item);
      acc[productId].totalQuantity += item.quantity;
      return acc;
    }, {} as Record<string, { items: CartItem[], totalQuantity: number }>);

    // Verificar promociones que requieren compra mínima o cantidad mínima
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
        // Verificar cantidad mínima para promociones "all"
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
          const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          if (totalItems >= promotion.conditions.minimumQuantity) {
            affectedItems.push(...updatedItems);
          }
        } else {
          affectedItems.push(...updatedItems);
        }
      } else if (promotion.applicability === 'category') {
        // Para promociones por categoría, verificar cantidad mínima por categoría
        const categoryItems = updatedItems.filter(item => {
          // Aquí necesitaríamos la categoría del item, por ahora usamos targetIds
          return promotion.targetIds?.some(targetId => item.id === targetId);
        });
        
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
          const categoryTotalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
          if (categoryTotalQuantity >= promotion.conditions.minimumQuantity) {
            affectedItems.push(...categoryItems);
          }
        } else {
          affectedItems.push(...categoryItems);
        }
      } else if (promotion.applicability === 'product') {
        // Para promociones por producto específico
        promotion.targetIds?.forEach(targetId => {
          const productGroup = itemsByProduct[targetId];
          if (productGroup) {
            if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
              if (productGroup.totalQuantity >= promotion.conditions.minimumQuantity) {
                affectedItems.push(...productGroup.items);
              }
            } else {
              affectedItems.push(...productGroup.items);
            }
          }
        });
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
            const itemIndex = updatedItems.findIndex(i => i.sku === item.sku);
            if (itemIndex !== -1) {
              const itemDiscount = promotion.type === 'percentage' 
                ? (item.price * promotion.value) / 100
                : promotion.value / affectedItems.reduce((sum, affectedItem) => sum + affectedItem.quantity, 0);
              
              const currentItem = updatedItems[itemIndex];
              const newPrice = Math.max(0, currentItem.price - itemDiscount);
              
              updatedItems[itemIndex] = {
                ...currentItem,
                originalPrice: currentItem.originalPrice || currentItem.price,
                price: newPrice,
                appliedPromotions: [
                  ...(currentItem.appliedPromotions || []),
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
