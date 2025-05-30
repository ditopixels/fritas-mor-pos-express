
import { Button } from "@/components/ui/button";
import { ProductVariant } from "@/types";

interface ProductVariantSelectorProps {
  productId: string;
  categoryId: string;
  variant: ProductVariant;
  productName: string;
  onAddToCart: (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => void;
}

export const ProductVariantSelector = ({ 
  productId, 
  categoryId,
  variant, 
  productName, 
  onAddToCart 
}: ProductVariantSelectorProps) => {
  
  const handleAddToCart = () => {
    console.log('ProductVariantSelector - Adding to cart:', { productId, categoryId, variant });
    onAddToCart(productId, categoryId, variant.id, variant.sku, productName, variant.name, variant.price);
  };

  return (
    <Button
      onClick={handleAddToCart}
      size="sm"
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0"
    >
      Agregar
    </Button>
  );
};
