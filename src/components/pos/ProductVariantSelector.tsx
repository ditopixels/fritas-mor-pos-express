
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductVariant, ProductOption } from "@/types";
import { Tag } from "lucide-react";

interface ProductVariantSelectorProps {
  productId: string;
  categoryId: string;
  variants: ProductVariant[];
  options: ProductOption[];
  productName: string;
  onAddToCart: (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number, selectedOptions?: Record<string, string | string[]>) => void;
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [matchedVariant, setMatchedVariant] = useState<ProductVariant | null>(null);

  console.log('ProductVariantSelector - Options received:', options);
  console.log('ProductVariantSelector - Selected options state:', selectedOptions);

  // Find matching variant based on selected options
  useEffect(() => {
    // Para encontrar variantes, solo consideramos las opciones de selección simple
    const singleSelectionOptions = Object.entries(selectedOptions).reduce((acc, [key, value]) => {
      const option = options.find(opt => opt.name === key);
      if (option?.selection_type === 'single' && typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const requiredSingleOptions = options.filter(opt => opt.isRequired && opt.selection_type === 'single');
    const hasAllRequiredSingleOptions = requiredSingleOptions.every(opt => singleSelectionOptions[opt.name]);

    if (hasAllRequiredSingleOptions) {
      const variant = variants.find(v => {
        return Object.entries(singleSelectionOptions).every(([optionName, selectedValue]) => {
          return v.optionValues[optionName] === selectedValue;
        });
      });
      setMatchedVariant(variant || null);
    } else {
      setMatchedVariant(null);
    }
  }, [selectedOptions, variants, options]);

  const handleSingleOptionChange = (optionName: string, value: string) => {
    console.log('Single option change:', optionName, value);
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleMultipleOptionChange = (optionName: string, value: string, checked: boolean) => {
    console.log('Multiple option change:', optionName, value, checked);
    setSelectedOptions(prev => {
      const currentValues = Array.isArray(prev[optionName]) ? prev[optionName] as string[] : [];
      
      let newValues: string[];
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }
      
      console.log('Updated multiple values for', optionName, ':', newValues);
      
      return {
        ...prev,
        [optionName]: newValues
      };
    });
  };

  const handleAddToCart = () => {
    if (matchedVariant) {
      console.log('ProductVariantSelector - Adding to cart with complete selected options:', selectedOptions);
      
      // Asegurar que todas las selecciones múltiples estén incluidas
      const completeSelectedOptions = { ...selectedOptions };
      
      console.log('Complete selected options being sent to cart:', completeSelectedOptions);
      
      onAddToCart(
        productId, 
        categoryId, 
        matchedVariant.id, 
        matchedVariant.sku, 
        productName, 
        matchedVariant.name, 
        matchedVariant.price,
        completeSelectedOptions
      );
    }
  };

  const appliedPromotions = matchedVariant 
    ? calculateItemPromotions(productId, categoryId, matchedVariant.price)
    : [];
  const hasPromotion = appliedPromotions.length > 0;
  const discountedPrice = matchedVariant && hasPromotion 
    ? matchedVariant.price - appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
    : matchedVariant?.price || 0;

  // Verificar si todas las opciones requeridas están seleccionadas
  const allRequiredOptionsSelected = options.filter(opt => opt.isRequired).every(option => {
    const selectedValue = selectedOptions[option.name];
    if (option.selection_type === 'single') {
      return typeof selectedValue === 'string' && selectedValue.length > 0;
    } else {
      return Array.isArray(selectedValue) && selectedValue.length > 0;
    }
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Dynamic Option Selectors */}
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
            {option.name}
            {option.isRequired && <span className="text-red-500 ml-1">*</span>}
            <span className="text-xs text-gray-500 ml-2">
              ({option.selection_type === 'single' ? 'Selección única' : 'Selección múltiple'})
            </span>
          </label>

          {option.selection_type === 'single' ? (
            <ToggleGroup
              type="single"
              value={typeof selectedOptions[option.name] === 'string' ? selectedOptions[option.name] as string : ""}
              onValueChange={(value) => value && handleSingleOptionChange(option.name, value)}
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {option.values.map((optionValue, index) => {
                const value = typeof optionValue === 'string' ? optionValue : optionValue.value;
                const currentSelection = Array.isArray(selectedOptions[option.name]) ? selectedOptions[option.name] as string[] : [];
                const isChecked = currentSelection.includes(value);
                
                return (
                  <div key={index} className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                    <Checkbox
                      id={`${option.name}-${index}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleMultipleOptionChange(option.name, value, checked as boolean)}
                    />
                    <label 
                      htmlFor={`${option.name}-${index}`} 
                      className="text-xs sm:text-sm cursor-pointer flex flex-col"
                    >
                      <span>{value}</span>
                      {typeof optionValue === 'object' && optionValue.additionalPrice && (
                        <span className="text-xs text-gray-500">
                          (+${optionValue.additionalPrice.toLocaleString()})
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Price and Add Button Section */}
      {allRequiredOptionsSelected && matchedVariant && (
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

          {/* Mostrar todas las selecciones realizadas */}
          {Object.entries(selectedOptions).some(([key, value]) => {
            return (typeof value === 'string' && value.length > 0) || 
                   (Array.isArray(value) && value.length > 0);
          }) && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <strong>Selecciones realizadas:</strong>
              {Object.entries(selectedOptions).map(([optionName, values]) => {
                if (typeof values === 'string' && values.length > 0) {
                  return (
                    <div key={optionName} className="mt-1">
                      {optionName}: {values}
                    </div>
                  );
                } else if (Array.isArray(values) && values.length > 0) {
                  return (
                    <div key={optionName} className="mt-1">
                      {optionName}: {values.join(', ')}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Instructions when options are not complete */}
      {options.length > 0 && !allRequiredOptionsSelected && (
        <div className="text-xs sm:text-sm text-gray-500 text-center py-2">
          Selecciona todas las opciones requeridas para ver el precio y agregar al carrito
        </div>
      )}
    </div>
  );
};
