import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Product, ProductVariant } from '@/hooks/useProducts';
import { CartItem } from '@/types';
import { toast } from 'sonner';
import { usePromotionCalculator } from '@/hooks/usePromotionCalculator';

interface ProductVariantSelectorProps {
  product: Product;
  onAddToCart: (item: CartItem) => void;
}

export const ProductVariantSelector = ({ product, onAddToCart }: ProductVariantSelectorProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { calculateItemPromotions } = usePromotionCalculator();

  const basePrice = product.base_price || 0;

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a cero.');
      return;
    }

    let itemPrice = basePrice;
    let variantName = '';
    let sku = product.id;

    if (selectedVariant) {
      itemPrice = selectedVariant.price;
      variantName = selectedVariant.name;
      sku = selectedVariant.sku;
    }

    const appliedPromotions = calculateItemPromotions(product.id, product.category_id, itemPrice);
    const discountedPrice = appliedPromotions.reduce((price, promo) => price - promo.discountAmount, itemPrice);

    const cartItem: CartItem = {
      id: product.id,
      productName: product.name,
      variantName: variantName,
      sku: sku,
      price: discountedPrice,
      quantity: quantity,
      image: product.image,
      variantId: selectedVariant ? selectedVariant.id : product.id,
      appliedPromotions: appliedPromotions,
    };

    onAddToCart(cartItem);
    toast.success(`${quantity} ${product.name} agregado al carrito.`);
  };

  return (
    <div className="flex flex-col space-y-4">
      {product.variants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="variant">Variante</Label>
          <select
            id="variant"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedVariant ? selectedVariant.id : ''}
            onChange={(e) => {
              const variantId = e.target.value;
              const variant = product.variants.find((v) => v.id === variantId) || null;
              setSelectedVariant(variant);
            }}
          >
            <option value="">Seleccionar Variante</option>
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} - ${variant.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex flex-col">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Agregar al Carrito</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar adición al carrito</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro de que desea agregar {quantity} {product.name} al carrito?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleAddToCart}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
