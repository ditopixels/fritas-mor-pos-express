
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductVariant, ProductOption, ProductAttachment } from "@/types";
import { Tag } from "lucide-react";

interface ProductVariantSelectorProps {
  productId: string;
  categoryId: string;
  variants: ProductVariant[];
  options: ProductOption[];
  attachments: ProductAttachment[];
  productName: string;
  onAddToCart: (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number, selectedOptions?: Record<string, string>, selectedAttachments?: Record<string, string[]>) => void;
  calculateItemPromotions: (productId: string, categoryId: string, price: number) => any[];
}

export const ProductVariantSelector = ({ 
  productId, 
  categoryId,
  variants, 
  options,
  attachments,
  productName, 
  onAddToCart,
  calculateItemPromotions
}: ProductVariantSelectorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAttachments, setSelectedAttachments] = useState<Record<string, string[]>>({});
  const [matchedVariant, setMatchedVariant] = useState<ProductVariant | null>(null);

  console.log('ProductVariantSelector - Options:', options, 'Attachments:', attachments);

  // Find matching variant based on selected options (only single selection now)
  useEffect(() => {
    const requiredOptions = options.filter(opt => opt.isRequired);
    const hasAllRequiredOptions = requiredOptions.every(opt => selectedOptions[opt.name]);

    if (hasAllRequiredOptions) {
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
    console.log('Option change:', optionName, value);
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAttachmentChange = (attachmentName: string, value: string, checked: boolean) => {
    console.log('Attachment change:', attachmentName, value, checked);
    setSelectedAttachments(prev => {
      const currentValues = prev[attachmentName] || [];
      
      let newValues: string[];
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }
      
      return {
        ...prev,
        [attachmentName]: newValues
      };
    });
  };

  const handleAddToCart = () => {
    if (matchedVariant) {
      console.log('Adding to cart with options:', selectedOptions, 'attachments:', selectedAttachments);
      
      onAddToCart(
        productId, 
        categoryId, 
        matchedVariant.id, 
        matchedVariant.sku, 
        productName, 
        matchedVariant.name, 
        matchedVariant.price,
        selectedOptions,
        selectedAttachments
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

  // Check if all required options and attachments are selected
  const allRequiredOptionsSelected = options.filter(opt => opt.isRequired).every(option => {
    return selectedOptions[option.name] && selectedOptions[option.name].length > 0;
  });

  const allRequiredAttachmentsSelected = attachments.filter(att => att.isRequired).every(attachment => {
    return selectedAttachments[attachment.name] && selectedAttachments[attachment.name].length > 0;
  });

  const canAddToCart = allRequiredOptionsSelected && allRequiredAttachmentsSelected;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Options Selectors (Single selection only) */}
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
            {option.name}
            {option.isRequired && <span className="text-red-500 ml-1">*</span>}
            <span className="text-xs text-gray-500 ml-2">(Selección única)</span>
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
                </div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}

      {/* Attachments Selectors (Multiple selection) */}
      {attachments.map((attachment) => (
        <div key={attachment.id} className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 block">
            {attachment.name}
            {attachment.isRequired && <span className="text-red-500 ml-1">*</span>}
            <span className="text-xs text-gray-500 ml-2">(Selección múltiple - Sin costo adicional)</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {attachment.values.map((value, index) => {
              const currentSelection = selectedAttachments[attachment.name] || [];
              const isChecked = currentSelection.includes(value);
              
              return (
                <div key={index} className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <Checkbox
                    id={`${attachment.name}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleAttachmentChange(attachment.name, value, checked as boolean)}
                  />
                  <label 
                    htmlFor={`${attachment.name}-${index}`} 
                    className="text-xs sm:text-sm cursor-pointer"
                  >
                    {value}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Price and Add Button Section */}
      {canAddToCart && matchedVariant && (
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

          {/* Show selected options and attachments */}
          {(Object.keys(selectedOptions).length > 0 || Object.keys(selectedAttachments).length > 0) && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <strong>Selecciones realizadas:</strong>
              {Object.entries(selectedOptions).map(([optionName, value]) => (
                <div key={optionName} className="mt-1">
                  {optionName}: {value}
                </div>
              ))}
              {Object.entries(selectedAttachments).map(([attachmentName, values]) => 
                values.length > 0 && (
                  <div key={attachmentName} className="mt-1">
                    {attachmentName}: {values.join(', ')}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions when selections are not complete */}
      {(options.length > 0 || attachments.length > 0) && !canAddToCart && (
        <div className="text-xs sm:text-sm text-gray-500 text-center py-2">
          Selecciona todas las opciones y elementos requeridos para continuar
        </div>
      )}
    </div>
  );
};
