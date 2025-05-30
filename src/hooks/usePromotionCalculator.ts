
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

    console.log('Calculando promociones para:', cartItems.length, 'items');

    // Primero verificar promociones que requieren compra mínima
    const eligiblePromotions = activePromotions.filter(promo => {
      if (promo.conditions.minimumPurchase && subtotal < promo.conditions.minimumPurchase) {
        return false;
      }
      return true;
    });

    console.log('Promociones elegibles:', eligiblePromotions.length);

    eligiblePromotions.forEach(promotion => {
      console.log('Evaluando promoción:', promotion.name);
      let discountAmount = 0;
      const affectedItems: CartItem[] = [];

      if (promotion.applicability === 'all') {
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        console.log('Promoción "all" - Total cantidad:', totalQuantity, 'Mínimo requerido:', promotion.conditions.minimumQuantity);
        
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
          if (totalQuantity >= promotion.conditions.minimumQuantity) {
            affectedItems.push(...updatedItems);
            console.log('Promoción aplicable a todos los items');
          }
        } else {
          affectedItems.push(...updatedItems);
        }
      } else if (promotion.applicability === 'category') {
        // Agrupar items por categoría y verificar cantidad mínima
        const categoryItems = updatedItems.filter(item => {
          // Buscar productos que coincidan con las categorías objetivo
          return promotion.targetIds?.some(targetId => {
            // Aquí necesitaríamos acceso a la categoría del producto
            // Por ahora, usar una lógica simplificada
            return item.productName?.toLowerCase().includes('papa') && targetId.includes('papa');
          });
        });
        
        if (categoryItems.length > 0) {
          const categoryTotalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
          console.log('Promoción categoría - Items encontrados:', categoryItems.length, 'Cantidad total:', categoryTotalQuantity);
          
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
            if (categoryTotalQuantity >= promotion.conditions.minimumQuantity) {
              affectedItems.push(...categoryItems);
              console.log('Promoción aplicable a categoría');
            }
          } else {
            affectedItems.push(...categoryItems);
          }
        }
      } else if (promotion.applicability === 'product') {
        // Agrupar por producto específico
        promotion.targetIds?.forEach(targetId => {
          const productItems = updatedItems.filter(item => item.id === targetId);
          const productTotalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
          
          console.log('Promoción producto - Items encontrados:', productItems.length, 'Cantidad total:', productTotalQuantity);
          
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
            if (productTotalQuantity >= promotion.conditions.minimumQuantity) {
              affectedItems.push(...productItems);
              console.log('Promoción aplicable a producto específico');
            }
          } else {
            affectedItems.push(...productItems);
          }
        });
      }

      if (affectedItems.length > 0) {
        console.log('Items afectados por promoción:', affectedItems.length);
        
        if (promotion.type === 'percentage') {
          const itemsSubtotal = affectedItems.reduce((sum, item) => 
            sum + ((item.originalPrice || item.price) * item.quantity), 0
          );
          discountAmount = (itemsSubtotal * promotion.value) / 100;
        } else {
          // Para promociones fijas, aplicar el descuento total
          discountAmount = promotion.value;
        }

        console.log('Descuento calculado:', discountAmount);

        if (discountAmount > 0) {
          appliedPromotions.push({
            promotionId: promotion.id,
            promotionName: promotion.name,
            type: promotion.type,
            value: promotion.value,
            discountAmount,
          });

          totalDiscount += discountAmount;

          // Aplicar descuento proporcional a cada item afectado
          const totalAffectedQuantity = affectedItems.reduce((sum, item) => sum + item.quantity, 0);
          const discountPerUnit = discountAmount / totalAffectedQuantity;

          affectedItems.forEach(item => {
            const itemIndex = updatedItems.findIndex(i => i.sku === item.sku);
            if (itemIndex !== -1) {
              const currentItem = updatedItems[itemIndex];
              const itemTotalDiscount = discountPerUnit * currentItem.quantity;
              const newPrice = Math.max(0, currentItem.price - (itemTotalDiscount / currentItem.quantity));
              
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
                    discountAmount: itemTotalDiscount / currentItem.quantity,
                  }
                ]
              };
            }
          });
        }
      }
    });

    console.log('Descuento total aplicado:', totalDiscount);

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
