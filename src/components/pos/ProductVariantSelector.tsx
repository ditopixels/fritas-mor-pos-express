
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductVariant } from "@/types";
import { Tag } from "lucide-react";

interface ProductVariantSelectorProps {
  productId: string;
  categoryId: string;
  variants: ProductVariant[];
  productName: string;
  onAddToCart: (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => void;
  calculateItemPromotions: (productId: string, categoryId: string, price: number) => any[];
}

export const ProductVariantSelector = ({ 
  productId, 
  categoryId,
  variants, 
  productName, 
  onAddToCart,
  calculateItemPromotions
}: ProductVariantSelectorProps) => {
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  const handleAddToCart = () => {
    const variant = variants.find(v => v.id === selectedVariant);
    if (variant) {
      console.log('ProductVariantSelector - Adding to cart:', { productId, categoryId, variant });
      onAddToCart(productId, categoryId, variant.id, variant.sku, productName, variant.name, variant.price);
    }
  };

  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const appliedPromotions = selectedVariantData 
    ? calculateItemPromotions(productId, categoryId, selectedVariantData.price)
    : [];
  const hasPromotion = appliedPromotions.length > 0;
  const discountedPrice = selectedVariantData && hasPromotion 
    ? selectedVariantData.price - appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
    : selectedVariantData?.price || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <Select value={selectedVariant} onValueChange={setSelectedVariant}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una variante" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => {
                const variantPromotions = calculateItemPromotions(productId, categoryId, variant.price);
                const variantHasPromotion = variantPromotions.length > 0;
                const variantDiscountedPrice = variantHasPromotion 
                  ? variant.price - variantPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
                  : variant.price;

                return (
                  <SelectItem key={variant.id} value={variant.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{variant.name}</span>
                      <div className="flex items-center space-x-2 ml-2">
                        {variantHasPromotion ? (
                          <>
                            <span className="text-gray-500 line-through text-sm">
                              ${variant.price.toLocaleString()}
                            </span>
                            <span className="font-bold text-red-600">
                              ${variantDiscountedPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            ${variant.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedVariant && (
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex-shrink-0"
          >
            Agregar
          </Button>
        )}
      </div>

      {selectedVariantData && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {hasPromotion ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 line-through">
                  ${selectedVariantData.price.toLocaleString()}
                </span>
                <span className="text-lg font-bold text-red-600">
                  ${discountedPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold">
                ${selectedVariantData.price.toLocaleString()}
              </span>
            )}
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
        </div>
      )}
    </div>
  );
};
