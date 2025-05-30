import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const ProductGrid = ({ products, onAddToCart }: ProductGridProps) => {
  return (
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
            </div>
            <button
              onClick={() => onAddToCart(product)}
              className="mt-4 w-full bg-blue-500 text-white rounded-md py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <ShoppingCart className="h-4 w-4 mr-2 inline-block" />
              Agregar
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
