
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { ProductVariant, ProductOption } from "@/types";
import { Tag } from "lucide-react";

interface ProductVariantSelectorProps {
  productId: string;
  categoryId: string;
  variants: ProductVariant[];
  options: ProductOption[];
  productName: string;
  onAddToCart: (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => void;
  calculateItemPromotions: (productId: string, categoryId: string, price: number) => any[];
}

export const ProductVariantSelector = ({ 
  productId, 
  categoryId,
  variants, 
  options,
  productName, 
  onAddToCart,
  calculateItemPromotions
}: ProductVariantSelectorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [matchedVariant, setMatchedVariant] = useState<ProductVariant | null>(null);

  // Find matching variant based on selected options
  useEffect(() => {
    if (Object.keys(selectedOptions).length === options.length && options.length > 0) {
      const variant = variants.find(v => {
        return Object.entries(selectedOptions).every(([optionName, selectedValue]) => {
          return v.optionValues[optionName] === selectedValue;
        });
      });
      setMatchedVariant(variant || null);
    } else {
      setMatchedVariant(null);
    }
  }, [selectedOptions, variants, options]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = () => {
    if (matchedVariant) {
      console.log('ProductVariantSelector - Adding to cart:', { productId, categoryId, variant: matchedVariant });
      onAddToCart(productId, categoryId, matchedVariant.id, matchedVariant.sku, productName, matchedVariant.name, matchedVariant.price);
    }
  };

  const appliedPromotions = matchedVariant 
    ? calculateItemPromotions(productId, categoryId, matchedVariant.price)
    : [];
  const hasPromotion = appliedPromotions.length > 0;
  const discountedPrice = matchedVariant && hasPromotion 
    ? matchedVariant.price - appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
    : matchedVariant?.price || 0;

  const allOptionsSelected = options.length > 0 && Object.keys(selectedOptions).length === options.length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Dynamic Option Selectors */}
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
            {option.name}
            {option.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <ToggleGroup
            type="single"
            value={selectedOptions[option.name] || ""}
            onValueChange={(value) => value && handleOptionChange(option.name, value)}
            className="flex flex-wrap gap-1 sm:gap-2 justify-start"
          >
            {option.values.map((optionValue, index) => (
              <ToggleGroupItem
                key={index}
                value={typeof optionValue === 'string' ? optionValue : optionValue.value}
                className="border border-gray-300 hover:bg-gray-100 data-[state=on]:bg-yellow-500 data-[state=on]:text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[40px]"
              >
                <div className="flex flex-col items-center text-center">
                  <span>{typeof optionValue === 'string' ? optionValue : optionValue.value}</span>
                  {typeof optionValue === 'object' && optionValue.additionalPrice && (
                    <span className="text-xs">
                      (+${optionValue.additionalPrice.toLocaleString()})
                    </span>
                  )}
                </div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}

      {/* Price and Add Button Section */}
      {allOptionsSelected && matchedVariant && (
        <div className="space-y-2 sm:space-y-3 pt-2 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              {hasPromotion ? (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 line-through text-sm sm:text-base">
                    ${matchedVariant.price.toLocaleString()}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-red-600">
                    ${discountedPrice.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-base sm:text-lg font-bold">
                  ${matchedVariant.price.toLocaleString()}
                </span>
              )}
            </div>
            
            <Button
              onClick={handleAddToCart}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              Agregar
            </Button>
          </div>

          {hasPromotion && (
            <div className="flex flex-wrap gap-1">
              {appliedPromotions.map((promo, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                  <Tag className="h-3 w-3 mr-1" />
                  {promo.promotionName}
                </Badge>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500">
            SKU: {matchedVariant.sku}
          </div>
        </div>
      )}

      {/* Instructions when options are not complete */}
      {options.length > 0 && !allOptionsSelected && (
        <div className="text-xs sm:text-sm text-gray-500 text-center py-2">
          Selecciona todas las opciones para ver el precio y agregar al carrito
        </div>
      )}
    </div>
  );
};
