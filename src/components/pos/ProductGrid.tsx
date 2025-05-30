
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CartItem } from "@/types";
import { useProducts, Product, ProductVariant } from "@/hooks/useProducts";

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, isLoading, error } = useProducts();
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

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    // Si no hay variante específica, crear una por defecto
    const defaultVariant = variant || {
      id: product.id,
      product_id: product.id,
      sku: product.id,
      name: product.name,
      price: 5000, // Precio por defecto
      option_values: {},
      is_active: true,
    };

    const item = {
      id: product.id,
      productName: product.name,
      variantName: defaultVariant.name,
      sku: defaultVariant.sku,
      price: defaultVariant.price,
      image: product.image,
    };
    onAddToCart(item);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar los productos. Por favor intenta de nuevo.
      </div>
    );
  }

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
              {product.description && (
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              )}
              <div className="variants space-y-2">
                {product.variants && product.variants.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold">Variantes disponibles:</p>
                    {product.variants.map(variant => (
                      <div key={variant.id} className="flex justify-between items-center">
                        <span className="text-sm">{variant.name}</span>
                        <span className="text-sm font-bold">${variant.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : product.options && product.options.length > 0 ? (
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
                  <p className="text-gray-500 text-sm">Producto simple</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              {product.variants && product.variants.length > 0 ? (
                <div className="space-y-2 w-full">
                  {product.variants.map(variant => (
                    <Button 
                      key={variant.id}
                      onClick={() => handleAddToCart(product, variant)}
                      className="w-full"
                      variant="outline"
                    >
                      {variant.name} - ${variant.price.toLocaleString()}
                    </Button>
                  ))}
                </div>
              ) : (
                <Button 
                  onClick={() => handleAddToCart(product)}
                  className="w-full"
                >
                  Agregar - $5.000
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
