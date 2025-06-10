
import { useMemo } from 'react';
import { useOptimizedPOSData } from './useOptimizedQueries';
import { useLocalCache } from './useLocalCache';
import { CartItem, Promotion, AppliedPromotion } from '@/types';

export const useOptimizedPromotionCalculator = () => {
  const { data: posData } = useOptimizedPOSData();
  const promotions = posData?.promotions || [];

  // Cache local para promociones activas
  const { data: activePromotions } = useLocalCache(
    'active-promotions',
    async () => {
      const now = new Date();
      const currentDay = now.getDay();
      
      return promotions.filter(promotion => {
        if (!promotion.is_active) return false;
        
        const conditions = promotion.conditions as any || {};
        
        if (conditions.startDate && now < new Date(conditions.startDate)) return false;
        if (conditions.endDate && now > new Date(conditions.endDate)) return false;
        
        if (conditions.daysOfWeek && 
            conditions.daysOfWeek.length > 0 && 
            !conditions.daysOfWeek.includes(currentDay)) {
          return false;
        }
        
        return true;
      }).map(promotion => {
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
        } as Promotion;
      });
    },
    3 * 60 * 1000 // 3 minutos de cache
  );

  const checkItemEligibility = useMemo(() => {
    return (item: CartItem, promotion: Promotion) => {
      if (promotion.applicability === 'all') {
        return true;
      }

      if (promotion.applicability === 'category') {
        return promotion.target_id === item.categoryId;
      }

      if (promotion.applicability === 'product') {
        return promotion.target_id === item.id;
      }

      return false;
    };
  }, []);

  const calculatePromotions = useMemo(() => {
    return (cartItems: CartItem[], subtotal: number) => {
      if (!activePromotions || activePromotions.length === 0) {
        return {
          updatedItems: cartItems.map(item => ({
            ...item,
            originalPrice: item.originalPrice || item.price,
            appliedPromotions: [] as AppliedPromotion[]
          })),
          appliedPromotions: [],
          totalDiscount: 0,
          newSubtotal: subtotal,
        };
      }

      const appliedPromotions: AppliedPromotion[] = [];
      let totalDiscount = 0;
      const updatedItems = cartItems.map(item => ({
        ...item,
        originalPrice: item.originalPrice || item.price,
        appliedPromotions: [] as AppliedPromotion[]
      }));

      // Verificar promociones que requieren compra mínima
      const eligiblePromotions = activePromotions.filter(promo => {
        if (promo.conditions.minimumPurchase && subtotal < promo.conditions.minimumPurchase) {
          return false;
        }
        return true;
      });

      // Procesar cada promoción elegible
      eligiblePromotions.forEach(promotion => {
        let discountAmount = 0;

        // Filtrar items elegibles para esta promoción específica
        const eligibleItems = updatedItems.filter(item => checkItemEligibility(item, promotion));
        
        if (eligibleItems.length === 0) {
          return;
        }

        // Calcular cantidad total de items elegibles
        const totalEligibleQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Verificar cantidad mínima para los items elegibles
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
          if (totalEligibleQuantity < promotion.conditions.minimumQuantity) {
            return;
          }
        }

        // Calcular el descuento según el tipo de promoción
        if (promotion.type === 'percentage') {
          const itemsSubtotal = eligibleItems.reduce((sum, item) => 
            sum + (item.originalPrice * item.quantity), 0
          );
          discountAmount = (itemsSubtotal * promotion.value) / 100;
        } else if (promotion.type === 'fixed') {
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity >= 3) {
            // Promoción tipo 3x2: por cada grupo de cantidad mínima, aplicar descuento
            const groups = Math.floor(totalEligibleQuantity / promotion.conditions.minimumQuantity);
            discountAmount = groups * promotion.value;
          } else {
            // Descuento fijo por unidad
            discountAmount = promotion.value * totalEligibleQuantity;
          }
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

          // Aplicar descuento proporcional solo a los items elegibles
          const totalAffectedQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
          const discountPerUnit = discountAmount / totalAffectedQuantity;

          eligibleItems.forEach(eligibleItem => {
            const itemIndex = updatedItems.findIndex(i => i.sku === eligibleItem.sku);
            if (itemIndex !== -1) {
              const currentItem = updatedItems[itemIndex];
              const itemTotalDiscount = discountPerUnit * currentItem.quantity;
              const newPrice = Math.max(0, currentItem.originalPrice - (itemTotalDiscount / currentItem.quantity));
              
              updatedItems[itemIndex] = {
                ...currentItem,
                price: newPrice,
                appliedPromotions: [
                  ...currentItem.appliedPromotions,
                  {
                    promotionId: promotion.id,
                    promotionName: promotion.name,
                    type: promotion.type,
                    value: promotion.value,
                    discountAmount: itemTotalDiscount / currentItem.quantity,
                  }
                ]
              };
            }
          });
        }
      });

      return {
        updatedItems,
        appliedPromotions,
        totalDiscount,
        newSubtotal: subtotal - totalDiscount,
      };
    };
  }, [activePromotions, checkItemEligibility]);

  const calculateItemPromotions = useMemo(() => {
    return (productId: string, categoryId: string, price: number) => {
      if (!activePromotions || activePromotions.length === 0) {
        return [];
      }

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
          isApplicable = promotion.target_id === categoryId;
        } else if (promotion.applicability === 'product') {
          isApplicable = promotion.target_id === productId;
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
  }, [activePromotions]);

  return {
    activePromotions: activePromotions || [],
    calculatePromotions,
    calculateItemPromotions,
  };
};
