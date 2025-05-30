
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

  const checkItemEligibility = (item: CartItem, promotion: Promotion) => {
    console.log(`\n--- Verificando elegibilidad para ${item.productName} ---`);
    console.log('Promoción:', promotion.name);
    console.log('Aplicabilidad:', promotion.applicability);
    console.log('Target IDs:', promotion.targetIds);

    if (promotion.applicability === 'all') {
      console.log('✓ Promoción aplica a todos los productos');
      return true;
    }

    if (promotion.applicability === 'category') {
      // Para promociones de categoría, verificar si el item pertenece a la categoría específica
      const isEligible = promotion.targetIds?.includes(item.categoryId || '') || false;
      console.log(`Categoría del item: ${item.categoryId}, Coincide: ${isEligible}`);
      return isEligible;
    }

    if (promotion.applicability === 'product') {
      // Para promociones de producto específico, verificar si el item está en la lista de productos objetivo
      const isEligible = promotion.targetIds?.includes(item.id) || false;
      console.log(`ID del producto: ${item.id}, Coincide: ${isEligible}`);
      return isEligible;
    }

    return false;
  };

  const calculatePromotions = (cartItems: CartItem[], subtotal: number) => {
    const appliedPromotions: AppliedPromotion[] = [];
    let totalDiscount = 0;
    const updatedItems = [...cartItems];

    console.log('=== CALCULANDO PROMOCIONES ===');
    console.log('Items en carrito:', cartItems.length);
    console.log('Items details:', cartItems.map(item => ({ name: item.productName, id: item.id, categoryId: item.categoryId })));
    console.log('Subtotal:', subtotal);
    console.log('Promociones activas:', activePromotions.length);

    // Verificar promociones que requieren compra mínima
    const eligiblePromotions = activePromotions.filter(promo => {
      if (promo.conditions.minimumPurchase && subtotal < promo.conditions.minimumPurchase) {
        console.log(`Promoción ${promo.name} descartada: compra mínima ${promo.conditions.minimumPurchase}, actual ${subtotal}`);
        return false;
      }
      return true;
    });

    console.log('Promociones elegibles por compra mínima:', eligiblePromotions.length);

    // Procesar cada promoción elegible
    eligiblePromotions.forEach(promotion => {
      console.log(`\n--- Evaluando promoción: ${promotion.name} ---`);
      console.log('Tipo:', promotion.type, 'Valor:', promotion.value);
      console.log('Aplicabilidad:', promotion.applicability);
      console.log('Cantidad mínima:', promotion.conditions.minimumQuantity);
      
      let discountAmount = 0;
      const affectedItems: CartItem[] = [];

      // Filtrar items elegibles para esta promoción específica
      const eligibleItems = updatedItems.filter(item => checkItemEligibility(item, promotion));
      
      console.log('Items elegibles para esta promoción:', eligibleItems.length);
      eligibleItems.forEach(item => console.log(`- ${item.productName}`));

      if (eligibleItems.length === 0) {
        console.log('✗ No hay items elegibles para esta promoción');
        return;
      }

      // Verificar cantidad mínima para los items elegibles
      const totalEligibleQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
        if (totalEligibleQuantity < promotion.conditions.minimumQuantity) {
          console.log(`✗ No se cumple cantidad mínima: requerida ${promotion.conditions.minimumQuantity}, actual ${totalEligibleQuantity}`);
          return;
        }
      }

      console.log('✓ Promoción aplicable, calculando descuento...');
      affectedItems.push(...eligibleItems);

      if (promotion.type === 'percentage') {
        const itemsSubtotal = affectedItems.reduce((sum, item) => 
          sum + ((item.originalPrice || item.price) * item.quantity), 0
        );
        discountAmount = (itemsSubtotal * promotion.value) / 100;
        console.log('Descuento porcentual - Subtotal items elegibles:', itemsSubtotal, 'Descuento:', discountAmount);
      } else {
        // Para promociones fijas como 3x2
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity >= 3) {
          // Promoción 3x2: por cada 3 items elegibles, descuento del valor del más barato
          const groupsOf3 = Math.floor(totalEligibleQuantity / 3);
          const cheapestPrice = Math.min(...affectedItems.map(item => item.originalPrice || item.price));
          discountAmount = groupsOf3 * cheapestPrice;
          console.log('Promoción 3x2 - Grupos de 3:', groupsOf3, 'Precio más barato:', cheapestPrice, 'Descuento total:', discountAmount);
        } else {
          discountAmount = promotion.value;
        }
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

        // Aplicar descuento proporcional solo a los items elegibles
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
      } else {
        console.log('✗ Descuento calculado es 0');
      }
    });

    console.log('=== RESUMEN FINAL ===');
    console.log('Descuento total aplicado:', totalDiscount);
    console.log('Nuevo subtotal:', subtotal - totalDiscount);

    return {
      updatedItems,
      appliedPromotions,
      totalDiscount,
      newSubtotal: subtotal - totalDiscount,
    };
  };

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

  return {
    activePromotions,
    calculatePromotions,
    calculateItemPromotions,
  };
};
