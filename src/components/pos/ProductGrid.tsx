
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { CartItem } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "lucide-react";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { calculateItemPromotions } = usePromotionCalculator();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.is_active,
        displayOrder: category.display_order,
        createdAt: new Date(category.created_at),
      }));
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_options(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('ProductGrid - Raw data from database:', data);

      return data.map(product => {
        const transformedProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          image: product.image,
          base_price: product.base_price,
          isActive: product.is_active,
          displayOrder: product.display_order,
          createdAt: new Date(product.created_at),
          variants: product.product_variants?.map((variant: any) => ({
            id: variant.id,
            productId: variant.product_id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            optionValues: variant.option_values || {},
            isActive: variant.is_active,
            stock: variant.stock,
          })) || [],
          options: product.product_options?.map((option: any) => ({
            id: option.id,
            name: option.name,
            values: option.values || [],
            isRequired: option.is_required,
          })) || []
        };
        
        console.log(`ProductGrid - Producto ${product.name}:`, {
          id: product.id,
          variantsFromDB: product.product_variants?.length || 0,
          optionsFromDB: product.product_options?.length || 0,
          variantsTransformed: transformedProduct.variants.length,
          optionsTransformed: transformedProduct.options.length,
          variants: transformedProduct.variants,
          options: transformedProduct.options
        });
        
        return transformedProduct;
      });
    },
  });

  const handleAddToCart = (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => {
    console.log('ProductGrid - Adding to cart:', { productId, categoryId, variantId, sku, productName, variantName, price });
    
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

    console.log('ProductGrid - Cart item created:', cartItem);
    onAddToCart(cartItem);
  };

  // Set first category as default if none selected
  if (categories.length > 0 && !selectedCategory) {
    setSelectedCategory(categories[0].id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 sm:mb-6 px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Productos</h2>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {categories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 px-2 sm:px-0">
        <div className="space-y-3 sm:space-y-4 pb-4">
          {products.map((product) => {
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Content Section */}
                    <div className="flex-1 p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{product.description}</p>
                      )}

                      {/* Debug info más visible */}
                      <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                        <strong>DEBUG:</strong> Variantes: {product.variants?.length || 0} | Opciones: {product.options?.length || 0}
                        {product.variants?.length > 0 && (
                          <div className="mt-1">
                            Variantes encontradas: {product.variants.map(v => v.name).join(', ')}
                          </div>
                        )}
                      </div>

                      {product.variants?.length > 0 && product.options?.length > 0 ? (
                        <ProductVariantSelector
                          productId={product.id}
                          categoryId={product.categoryId || ''}
                          variants={product.variants}
                          options={product.options}
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
                              product.categoryId || '',
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
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
