
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";

interface ProductVariantSelectorProps {
  product: Product;
  onAddToCart: (variant: ProductVariant, selectedOptions: Record<string, string>) => void;
}

export const ProductVariantSelector = ({ product, onAddToCart }: ProductVariantSelectorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
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

  const canAddDirectly = !product.options || product.options.length === 0;

  if (canAddDirectly && product.variants && product.variants.length > 0) {
    // Producto con variantes simples sin opciones complejas
    return (
      <div className="space-y-2 w-full">
        {product.variants.map(variant => {
          const finalPrice = getFinalPrice(variant.price);
          const hasDiscount = finalPrice < variant.price;
          
          return (
            <Button 
              key={variant.id}
              onClick={() => onAddToCart(variant, {})}
              className="w-full relative"
              variant="outline"
              size="sm"
            >
              {getPromotionBadge(variant.price) && (
                <div className="absolute -top-1 -right-1 z-10">
                  {getPromotionBadge(variant.price)}
                </div>
              )}
              <div className="flex justify-between items-center w-full">
                <span>{variant.name}</span>
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
    );
  }

  if (product.options && product.options.length > 0) {
    // Producto con opciones complejas
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="sm">
            Personalizar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {product.options.map(option => (
              <div key={option.id}>
                <label className="text-sm font-medium">
                  {option.name} {option.is_required && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {option.values.map(value => (
                    <Button
                      key={value}
                      variant={selectedOptions[option.name] === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOptionChange(option.name, value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            
            {getAvailableVariants().length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Variantes disponibles:</label>
                {getAvailableVariants().map(variant => {
                  const finalPrice = getFinalPrice(variant.price);
                  const hasDiscount = finalPrice < variant.price;
                  
                  return (
                    <Button
                      key={variant.id}
                      onClick={() => {
                        onAddToCart(variant, selectedOptions);
                        setIsOpen(false);
                        setSelectedOptions({});
                      }}
                      className="w-full relative"
                      variant="outline"
                    >
                      {getPromotionBadge(variant.price) && (
                        <div className="absolute -top-1 -right-1 z-10">
                          {getPromotionBadge(variant.price)}
                        </div>
                      )}
                      <div className="flex justify-between items-center w-full">
                        <span>{variant.name}</span>
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Producto simple sin variantes
  const basePrice = product.base_price || 5000;
  const finalPrice = getFinalPrice(basePrice);
  const hasDiscount = finalPrice < basePrice;

  return (
    <Button 
      onClick={() => onAddToCart({
        id: `${product.id}-default`,
        product_id: product.id,
        sku: `${product.id}-default`,
        name: product.name,
        price: basePrice,
        option_values: {},
        is_active: true,
      }, {})}
      className="w-full relative"
      size="sm"
    >
      {getPromotionBadge(basePrice) && (
        <div className="absolute -top-1 -right-1 z-10">
          {getPromotionBadge(basePrice)}
        </div>
      )}
      <div className="flex justify-between items-center w-full">
        <span>Agregar</span>
        <div className="flex items-center space-x-2">
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ${basePrice.toLocaleString()}
            </span>
          )}
          <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
            ${finalPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </Button>
  );
};
