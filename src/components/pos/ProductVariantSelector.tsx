
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";
import { v4 as uuidv4 } from 'uuid';

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

  const isValidSelection = () => {
    const requiredOptions = product.options?.filter(opt => opt.is_required) || [];
    return requiredOptions.every(opt => selectedOptions[opt.name]);
  };

  const getMatchingVariant = () => {
    if (!product.variants || product.variants.length === 0) return null;
    
    return product.variants.find(variant => {
      return Object.entries(selectedOptions).every(([key, value]) => 
        variant.option_values[key] === value
      );
    });
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

  // Si el producto tiene opciones, mostrar selector de opciones
  if (product.options && product.options.length > 0) {
    const matchingVariant = getMatchingVariant();
    const canAdd = isValidSelection() && matchingVariant;
    
    return (
      <div className="space-y-3 w-full">
        {/* Mostrar opciones */}
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
        
        {/* Mostrar botón de agregar solo si la selección es válida */}
        {canAdd && matchingVariant && (
          <div className="space-y-2">
            <Button 
              onClick={() => onAddToCart(matchingVariant, selectedOptions)}
              className="w-full relative justify-between h-auto p-2"
              variant="default"
              size="sm"
            >
              {getPromotionBadge(matchingVariant.price) && (
                <div className="absolute -top-1 -right-1 z-10">
                  {getPromotionBadge(matchingVariant.price)}
                </div>
              )}
              <div className="flex justify-between items-center w-full">
                <span className="text-sm">Agregar {matchingVariant.name}</span>
                <div className="flex items-center space-x-2">
                  {getFinalPrice(matchingVariant.price) < matchingVariant.price && (
                    <span className="text-xs text-gray-500 line-through">
                      ${matchingVariant.price.toLocaleString()}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${getFinalPrice(matchingVariant.price) < matchingVariant.price ? 'text-red-600' : ''}`}>
                    ${getFinalPrice(matchingVariant.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Producto simple sin variantes - crear variante temporal con UUID válido
  const basePrice = product.base_price || 5000;
  const finalPrice = getFinalPrice(basePrice);
  const hasDiscount = finalPrice < basePrice;

  return (
    <div 
      onClick={() => onAddToCart({
        id: uuidv4(), // Generar UUID válido
        product_id: product.id,
        sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-DEFAULT`,
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
