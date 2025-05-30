
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { useProducts, useCategories, Product, ProductVariant } from "@/hooks/useProducts";

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Ordenar categorías por el orden predefinido
  const sortedCategories = categories?.sort((a, b) => {
    const order = { 'Papas': 1, 'Hamburguesas': 2, 'Pinchos': 3, 'Gaseosas': 4 };
    const aOrder = order[a.name as keyof typeof order] || 99;
    const bOrder = order[b.name as keyof typeof order] || 99;
    return aOrder - bOrder;
  });

  // Seleccionar la primera categoría por defecto
  useEffect(() => {
    if (sortedCategories && sortedCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(sortedCategories[0].id);
    }
  }, [sortedCategories, selectedCategory]);

  useEffect(() => {
    if (products && selectedCategory) {
      const filtered = products.filter(product => product.category_id === selectedCategory);
      setFilteredProducts(filtered);
    }
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    // Si hay variante específica, usarla; sino crear una por defecto
    const defaultVariant = variant || {
      id: `${product.id}-default`,
      product_id: product.id,
      sku: `${product.id}-default`,
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
      variantId: variant ? variant.id : undefined, // Solo incluir si es una variante real
    };
    onAddToCart(item);
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar los productos. Por favor intenta de nuevo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botones de categorías grandes con imágenes - sin "Todos" */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedCategories?.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className={`h-20 flex flex-col items-center justify-center space-y-2 text-sm font-semibold transition-all duration-200 ${
              selectedCategory === category.id 
                ? "bg-yellow-500 text-white border-yellow-600 shadow-lg scale-105" 
                : "bg-white hover:bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="text-2xl animate-bounce">
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                // Emojis por defecto basados en el nombre de la categoría
                category.name === 'Papas' ? '🍟' :
                category.name === 'Hamburguesas' ? '🍔' :
                category.name === 'Pinchos' ? '🍖' :
                category.name === 'Gaseosas' ? '🥤' : '🍽️'
              )}
            </div>
            <span className="text-xs">{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {products?.length === 0 
              ? "No hay productos disponibles" 
              : "No se encontraron productos en esta categoría"}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-sm">{product.name}</CardTitle>
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
                <div className="text-xs text-gray-500 mb-2">
                  Categoría: {product.category?.name || 'Sin categoría'}
                </div>
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
                        size="sm"
                      >
                        {variant.name} - ${variant.price.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                  >
                    Agregar - $5.000
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
