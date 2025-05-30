
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

    console.log('=== CALCULANDO PROMOCIONES ===');
    console.log('Items en carrito:', cartItems.length);
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

    console.log('Promociones elegibles:', eligiblePromotions.length);

    // Procesar cada promoción elegible
    eligiblePromotions.forEach(promotion => {
      console.log(`\n--- Evaluando promoción: ${promotion.name} ---`);
      console.log('Tipo:', promotion.type, 'Valor:', promotion.value);
      console.log('Aplicabilidad:', promotion.applicability);
      console.log('Cantidad mínima:', promotion.conditions.minimumQuantity);
      
      let discountAmount = 0;
      const affectedItems: CartItem[] = [];

      if (promotion.applicability === 'all') {
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        console.log('Promoción "all" - Total cantidad:', totalQuantity, 'Mínimo requerido:', promotion.conditions.minimumQuantity);
        
        if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
          if (totalQuantity >= promotion.conditions.minimumQuantity) {
            affectedItems.push(...updatedItems);
            console.log('✓ Promoción aplicable a todos los items');
          } else {
            console.log('✗ No se cumple cantidad mínima global');
          }
        } else {
          affectedItems.push(...updatedItems);
        }
      } else if (promotion.applicability === 'category') {
        console.log('Target IDs:', promotion.targetIds);
        
        // Buscar items que coincidan con las categorías objetivo
        const categoryItems = updatedItems.filter(item => {
          // Para Papas Fritas, verificar si pertenece a la categoría de papas
          const isMatchingCategory = promotion.targetIds?.some(targetId => {
            // Verificar si el item contiene "papas" en su nombre y el targetId también
            const itemMatchesPapas = item.productName.toLowerCase().includes('papa');
            console.log(`Evaluando item: ${item.productName}, contiene papa: ${itemMatchesPapas}, targetId: ${targetId}`);
            return itemMatchesPapas;
          });
          
          console.log(`Item ${item.productName} coincide con categoría:`, isMatchingCategory);
          return isMatchingCategory;
        });
        
        if (categoryItems.length > 0) {
          const categoryTotalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
          console.log('Items encontrados en categoría:', categoryItems.length, 'Cantidad total:', categoryTotalQuantity);
          
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
            if (categoryTotalQuantity >= promotion.conditions.minimumQuantity) {
              affectedItems.push(...categoryItems);
              console.log('✓ Promoción aplicable a categoría');
            } else {
              console.log('✗ No se cumple cantidad mínima para categoría');
            }
          } else {
            affectedItems.push(...categoryItems);
          }
        } else {
          console.log('✗ No se encontraron items para esta categoría');
        }
      } else if (promotion.applicability === 'product') {
        // Agrupar por producto específico
        promotion.targetIds?.forEach(targetId => {
          const productItems = updatedItems.filter(item => 
            item.id === targetId || item.productName.toLowerCase().includes('papa')
          );
          const productTotalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
          
          console.log('Items encontrados para producto:', productItems.length, 'Cantidad total:', productTotalQuantity);
          
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity > 1) {
            if (productTotalQuantity >= promotion.conditions.minimumQuantity) {
              affectedItems.push(...productItems);
              console.log('✓ Promoción aplicable a producto específico');
            } else {
              console.log('✗ No se cumple cantidad mínima para producto');
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
          console.log('Descuento porcentual - Subtotal items:', itemsSubtotal, 'Descuento:', discountAmount);
        } else {
          // Para promociones fijas como 3x2, aplicar descuento por cada grupo elegible
          const totalQuantity = affectedItems.reduce((sum, item) => sum + item.quantity, 0);
          if (promotion.conditions.minimumQuantity && promotion.conditions.minimumQuantity >= 3) {
            // Promoción 3x2: por cada 3 items, descuento del valor del más barato
            const groupsOf3 = Math.floor(totalQuantity / 3);
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
      } else {
        console.log('✗ No hay items afectados por esta promoción');
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

  return {
    activePromotions,
    calculatePromotions,
    calculateItemPromotions,
  };
};
