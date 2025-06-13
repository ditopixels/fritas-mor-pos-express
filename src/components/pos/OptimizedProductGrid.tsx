
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { CartItem } from "@/types";
import { useOptimizedPOSData } from "@/hooks/useOptimizedQueries";
import { useAllProductsOnce, useFilteredProducts } from "@/hooks/useAllProductsOnce";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";
import { Pizza, Beef, Coffee, Utensils, Plus } from "lucide-react";

interface OptimizedProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

// Función para obtener el icono según el nombre de la categoría
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('papa')) return Pizza;
  if (name.includes('hamburguesa')) return Beef;
  if (name.includes('bebida')) return Coffee;
  if (name.includes('chuzo') || name.includes('carne')) return Utensils;
  if (name.includes('adicion')) return Plus;
  return Utensils; // icono por defecto
};

export const OptimizedProductGrid = ({ onAddToCart }: OptimizedProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { calculateItemPromotions } = usePromotionCalculator();

  // Cargar categorías
  const { data: posData, isLoading: posLoading } = useOptimizedPOSData();
  const categories = posData.categories || [];

  // Cargar TODOS los productos una sola vez
  const { data: allProducts = [], isLoading: productsLoading } = useAllProductsOnce();
  
  // Filtrar productos localmente según la categoría seleccionada
  const filteredProducts = useFilteredProducts(selectedCategory, allProducts);

  const handleAddToCart = (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => {
    console.log('OptimizedProductGrid - Adding to cart:', { productId, categoryId, variantId, sku, productName, variantName, price });
    
    const appliedPromotions = calculateItemPromotions(productId, categoryId, price);
    
    const cartItem: Omit<CartItem, "quantity"> = {
      id: productId,
      productName,
      variantName,
      sku,
      price,
      variantId,
      categoryId,
      appliedPromotions,
    };

    console.log('OptimizedProductGrid - Cart item created:', cartItem);
    onAddToCart(cartItem);
  };

  // Set first category as default if none selected
  if (categories.length > 0 && !selectedCategory) {
    setSelectedCategory(categories[0].id);
  }

  if (posLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="mb-4 sm:mb-6 px-2 sm:px-0 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Productos</h2>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="overflow-x-auto">
            <TabsList className="flex w-max min-w-full h-auto p-1 gap-1">
              {categories.map((category) => {
                const IconComponent = getCategoryIcon(category.name);
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-fit"
                  >
                    <IconComponent size={18} />
                    <span className="hidden sm:inline">{category.name}</span>
                    <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 px-2 sm:px-0 overflow-y-auto max-h-[880px]">
        <ScrollArea className="h-full">
          <div className="space-y-3 sm:space-y-4 pb-4 pr-2">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Content Section */}
                    <div className="flex-1 p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{product.description}</p>
                      )}

                      {product.product_variants?.length > 0 && product.product_options?.length > 0 ? (
                        <ProductVariantSelector
                          productId={product.id}
                          categoryId={product.category_id || ''}
                          variants={product.product_variants.map((variant: any) => ({
                            id: variant.id,
                            productId: variant.product_id,
                            sku: variant.sku,
                            name: variant.name,
                            price: variant.price,
                            optionValues: variant.option_values || {},
                            isActive: variant.is_active,
                            stock: variant.stock,
                          }))}
                          options={product.product_options.map((option: any) => ({
                            id: option.id,
                            name: option.name,
                            values: option.values || [],
                            isRequired: option.is_required,
                          }))}
                          productName={product.name}
                          onAddToCart={handleAddToCart}
                          calculateItemPromotions={calculateItemPromotions}
                        />
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                          <span className="text-base sm:text-lg font-bold">
                            ${(product.base_price || 0).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleAddToCart(
                              product.id,
                              product.category_id || '',
                              '',
                              `${product.id}-default`,
                              product.name,
                              'Estándar',
                              product.base_price || 0
                            )}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
                          >
                            Agregar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
