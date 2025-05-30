
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

      return data.map(product => ({
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

  // Set first category as default if none selected
  if (categories.length > 0 && !selectedCategory) {
    setSelectedCategory(categories[0].id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    )}

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
                      <div className="flex items-center justify-between">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
