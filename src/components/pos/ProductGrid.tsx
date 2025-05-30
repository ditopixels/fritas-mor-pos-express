
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
          product_variants(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (selectedCategory !== "all") {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.category_id,
        image: product.image,
        base_price: product.base_price,
        options: [],
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
        })) || []
      }));
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

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">🍽️</span>
                )}
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600 mb-4">{product.description}</p>
                )}

                <div className="space-y-3">
                  {product.variants?.length > 0 ? (
                    product.variants.map((variant) => {
                      const appliedPromotions = calculateItemPromotions(product.id, product.categoryId || '', variant.price);
                      const hasPromotion = appliedPromotions.length > 0;
                      const discountedPrice = hasPromotion 
                        ? variant.price - appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
                        : variant.price;

                      return (
                        <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{variant.name}</div>
                            <div className="flex items-center space-x-2">
                              {hasPromotion ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 line-through">
                                    ${variant.price.toLocaleString()}
                                  </span>
                                  <span className="text-lg font-bold text-red-600">
                                    ${discountedPrice.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold">
                                  ${variant.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            {hasPromotion && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {appliedPromotions.map((promo, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {promo.promotionName}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <ProductVariantSelector
                            productId={product.id}
                            categoryId={product.categoryId || ''}
                            variant={variant}
                            productName={product.name}
                            onAddToCart={handleAddToCart}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-lg font-bold">
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
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
