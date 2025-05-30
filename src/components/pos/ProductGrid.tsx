
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/types";
import { useProducts, useCategories, Product, ProductVariant } from "@/hooks/useProducts";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";
import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { calculateItemPromotions } = usePromotionCalculator();

  const sortedCategories = categories?.sort((a, b) => a.display_order - b.display_order);

  useEffect(() => {
    if (sortedCategories && sortedCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(sortedCategories[0].id);
    }
  }, [sortedCategories, selectedCategory]);

  useEffect(() => {
    if (products && selectedCategory) {
      const filtered = products.filter(product => product.category_id === selectedCategory);
      const sortedFiltered = filtered.sort((a, b) => a.display_order - b.display_order);
      setFilteredProducts(sortedFiltered);
    }
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product, variant: ProductVariant, selectedOptions: Record<string, string>) => {
    const appliedPromotions = calculateItemPromotions(
      product.id,
      product.category_id || '',
      variant.price
    );

    const finalPrice = appliedPromotions.length > 0 ? 
      appliedPromotions.reduce((price, promo) => price - promo.discountAmount, variant.price) :
      variant.price;

    // Crear un nombre único que incluya las opciones seleccionadas
    const variantDisplayName = Object.keys(selectedOptions).length > 0 
      ? `${variant.name} (${Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')})`
      : variant.name;

    const item = {
      id: variant.id,
      productName: product.name,
      variantName: variantDisplayName,
      sku: variant.sku,
      price: finalPrice,
      originalPrice: appliedPromotions.length > 0 ? variant.price : undefined,
      image: product.image,
      variantId: variant.id,
      appliedPromotions,
    };
    onAddToCart(item);
  };

  const getPromotionBadge = (productId: string, categoryId: string, price: number) => {
    const promotions = calculateItemPromotions(productId, categoryId, price);
    if (promotions.length === 0) return null;

    const totalDiscount = promotions.reduce((sum, promo) => sum + promo.discountAmount, 0);
    const percentage = Math.round((totalDiscount / price) * 100);

    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
        -{percentage}%
      </Badge>
    );
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
    <div className="space-y-6 h-full flex flex-col">
      {/* Botones de categorías - fijo arriba */}
      <div className="flex-shrink-0">
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
      </div>

      {/* Lista de productos con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {products?.length === 0 
                ? "No hay productos disponibles" 
                : "No se encontraron productos en esta categoría"}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const basePrice = product.variants?.[0]?.price || product.base_price || 5000;
              
              return (
                <Card key={product.id} className="relative w-full">
                  {getPromotionBadge(product.id, product.category_id || '', basePrice) && (
                    <div className="absolute top-2 right-2 z-10">
                      {getPromotionBadge(product.id, product.category_id || '', basePrice)}
                    </div>
                  )}
                  
                  <div className="flex items-center p-4 space-x-4">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">📦</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Categoría: {product.category?.name || 'Sin categoría'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selector de variantes - lado derecho */}
                    <div className="flex-shrink-0 min-w-[200px]">
                      <ProductVariantSelector 
                        product={product}
                        onAddToCart={(variant, selectedOptions) => handleAddToCart(product, variant, selectedOptions)}
                      />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
