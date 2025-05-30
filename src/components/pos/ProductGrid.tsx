
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { CartItem } from "@/types";
import { useProducts } from "@/hooks/useProducts";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { useState } from "react";

interface ProductGridProps {
  onAddToCart: (item: CartItem) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const { data: products, isLoading, error } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error al cargar productos</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No hay productos disponibles</p>
      </div>
    );
  }

  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
    } else {
      // Add product directly if no variants
      const cartItem: CartItem = {
        id: product.id,
        productName: product.name,
        variantName: '',
        sku: product.id,
        price: product.base_price || 0,
        quantity: 1,
        image: product.image,
        variantId: product.id,
      };
      onAddToCart(cartItem);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              {product.image && (
                <div className="relative w-full h-32 mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover rounded-md w-full h-full"
                  />
                </div>
              )}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-lg font-bold text-gray-900">
                  ${(product.base_price || 0).toLocaleString()}
                </p>
                {product.variants && product.variants.length > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {product.variants.length} variantes
                  </Badge>
                )}
              </div>
              <button
                onClick={() => handleProductClick(product)}
                className="mt-4 w-full bg-blue-500 text-white rounded-md py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <ShoppingCart className="h-4 w-4 mr-2 inline-block" />
                {product.variants && product.variants.length > 0 ? 'Seleccionar' : 'Agregar'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedProduct.name}</h3>
            <ProductVariantSelector
              product={selectedProduct}
              onAddToCart={(item) => {
                onAddToCart(item);
                setSelectedProduct(null);
              }}
            />
            <button
              onClick={() => setSelectedProduct(null)}
              className="mt-4 w-full bg-gray-500 text-white rounded-md py-2 hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
