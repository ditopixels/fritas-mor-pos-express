import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";

interface ProductVariantSelectorProps {
  product: Product;
  onAddToCart: (variant: ProductVariant, selectedOptions: Record<string, string>) => void;
}

export const ProductVariantSelector = ({ product, onAddToCart }: ProductVariantSelectorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const { calculateItemPromotions } = usePromotionCalculator();

  const getPromotionBadge = (price: number) => {
    const promotions = calculateItemPromotions(product.id, product.category_id || '', price);
    if (promotions.length === 0) return null;

    const totalDiscount = promotions.reduce((sum, promo) => sum + promo.discountAmount, 0);
    const percentage = Math.round((totalDiscount / price) * 100);

    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
        -{percentage}%
      </Badge>
    );
  };

  const getFinalPrice = (originalPrice: number) => {
    const promotions = calculateItemPromotions(product.id, product.category_id || '', originalPrice);
    if (promotions.length === 0) return originalPrice;
    return promotions.reduce((price, promo) => price - promo.discountAmount, originalPrice);
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const getAvailableVariants = () => {
    return product.variants?.filter(variant => {
      return Object.entries(selectedOptions).every(([key, value]) => 
        variant.option_values[key] === value
      );
    }) || [];
  };

  const isValidSelection = () => {
    const requiredOptions = product.options?.filter(opt => opt.is_required) || [];
    return requiredOptions.every(opt => selectedOptions[opt.name]);
  };

  // Si el producto no tiene opciones y solo tiene una variante simple, permitir agregar directamente
  if ((!product.options || product.options.length === 0) && product.variants && product.variants.length === 1) {
    const variant = product.variants[0];
    const finalPrice = getFinalPrice(variant.price);
    const hasDiscount = finalPrice < variant.price;
    
    return (
      <div 
        onClick={() => onAddToCart(variant, {})}
        className="w-full cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
      >
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-medium">{variant.name}</span>
          <div className="flex items-center space-x-2">
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                ${variant.price.toLocaleString()}
              </span>
            )}
            <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
              ${finalPrice.toLocaleString()}
            </span>
            {getPromotionBadge(variant.price)}
          </div>
        </div>
      </div>
    );
  }

  // Si el producto tiene múltiples variantes o opciones, mostrar selector
  if (product.variants && product.variants.length > 1) {
    return (
      <div className="space-y-3 w-full">
        {/* Mostrar opciones si las hay */}
        {product.options && product.options.length > 0 && (
          <div className="space-y-2">
            {product.options.map(option => (
              <div key={option.id} className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  {option.name} {option.is_required && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {option.values.map(value => (
                    <Button
                      key={value}
                      variant={selectedOptions[option.name] === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOptionChange(option.name, value)}
                      className="h-8 text-xs"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mostrar variantes disponibles */}
        <div className="space-y-2">
          {product.variants.map(variant => {
            // Si hay opciones, solo mostrar variantes que coincidan con la selección
            if (product.options && product.options.length > 0) {
              const matchesSelection = Object.entries(selectedOptions).every(([key, value]) => 
                variant.option_values[key] === value
              );
              if (!matchesSelection && Object.keys(selectedOptions).length > 0) return null;
            }

            const finalPrice = getFinalPrice(variant.price);
            const hasDiscount = finalPrice < variant.price;
            const canAdd = !product.options || product.options.length === 0 || isValidSelection();
            
            return (
              <Button 
                key={variant.id}
                onClick={() => canAdd && onAddToCart(variant, selectedOptions)}
                className="w-full relative justify-between h-auto p-2"
                variant="outline"
                size="sm"
                disabled={!canAdd}
              >
                {getPromotionBadge(variant.price) && (
                  <div className="absolute -top-1 -right-1 z-10">
                    {getPromotionBadge(variant.price)}
                  </div>
                )}
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm">{variant.name}</span>
                  <div className="flex items-center space-x-2">
                    {hasDiscount && (
                      <span className="text-xs text-gray-500 line-through">
                        ${variant.price.toLocaleString()}
                      </span>
                    )}
                    <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
                      ${finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // Producto simple sin variantes
  const basePrice = product.base_price || 5000;
  const finalPrice = getFinalPrice(basePrice);
  const hasDiscount = finalPrice < basePrice;

  return (
    <div 
      onClick={() => onAddToCart({
        id: `${product.id}-default`,
        product_id: product.id,
        sku: `${product.id}-default`,
        name: product.name,
        price: basePrice,
        option_values: {},
        is_active: true,
      }, {})}
      className="w-full cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-sm">Agregar</span>
        <div className="flex items-center space-x-2">
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ${basePrice.toLocaleString()}
            </span>
          )}
          <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
            ${finalPrice.toLocaleString()}
          </span>
          {getPromotionBadge(basePrice)}
        </div>
      </div>
    </div>
  );
};
