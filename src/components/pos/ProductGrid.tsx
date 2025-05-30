import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Product, ProductVariant } from "@/lib/api/products/queries";
import { useProducts } from "@/lib/api/products/hooks";
import { CartItem } from "@/types";

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, isLoading, isError } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products) {
      setFilteredProducts(products);
    }
  }, [products]);

  useEffect(() => {
    if (products) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  if (isError) {
    return <div>Error al cargar los productos.</div>;
  }

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    const item = {
      id: product.id,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      image: product.image,
    };
    onAddToCart(item);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover mb-4 rounded-md"
                />
              )}
              <div className="variants space-y-2">
                {product.options.length > 0 ? (
                  product.options.map(option => (
                    <div key={option.id} className="text-sm">
                      <p className="font-semibold">{option.name}:</p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map(value => (
                          <Button key={value} variant="outline" size="sm">
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay opciones disponibles.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              {/* Aquí podrías iterar sobre las variantes del producto */}
              {/* Por ahora, asumimos que cada producto tiene una variante por defecto */}
              {products && products.length > 0 && product.id ?
                (products?.find(p => p.id === product.id)?.options.length === 0 ?
                  <Button onClick={() => handleAddToCart(product, {
                    id: product.id,
                    productId: product.id,
                    sku: product.id,
                    name: product.name,
                    price: 1000,
                    optionValues: {},
                    isActive: true,
                  })}
                  >
                    Agregar al carrito
                  </Button>
                  :
                  <p className="text-gray-500">Seleccione las opciones para agregar al carrito.</p>)
                :
                <p className="text-gray-500">No hay variantes disponibles.</p>
              }
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
