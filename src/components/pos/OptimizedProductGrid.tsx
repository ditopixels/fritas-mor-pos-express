
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { CartItem } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "lucide-react";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";

interface OptimizedProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const OptimizedProductGrid = ({ onAddToCart }: OptimizedProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { calculateItemPromotions } = usePromotionCalculator();
  const queryClient = useQueryClient();

  // Invalidar cache de productos cada vez que se monta el componente
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('🔄 FETCHING CATEGORIES...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      console.log('✅ CATEGORIES LOADED:', data.length);
      
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

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      console.log('🔄 FETCHING PRODUCTS FOR CATEGORY:', selectedCategory);
      
      // Invalidar cache antes de hacer la consulta
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
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

      console.log('✅ PRODUCTS RAW DATA:', data.length, 'products');

      return data.map(product => {
        console.log(`🔍 PROCESSING PRODUCT: ${product.name}`);
        console.log('📊 VARIANTS FROM DB:', product.product_variants?.length || 0);
        
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
          variants: product.product_variants?.map((variant: any) => {
            console.log(`💰 VARIANT ${variant.name} - PRICE FROM DB: ${variant.price}`);
            return {
              id: variant.id,
              productId: variant.product_id,
              sku: variant.sku,
              name: variant.name,
              price: variant.price, // Precio directo de la base de datos
              optionValues: variant.option_values || {},
              isActive: variant.is_active,
              stock: variant.stock,
            };
          }) || [],
          options: product.product_options?.map((option: any) => ({
            id: option.id,
            name: option.name,
            values: option.values || [],
            isRequired: option.is_required,
          })) || []
        };
        
        console.log(`✅ PRODUCT ${product.name} TRANSFORMED:`, {
          variantsCount: transformedProduct.variants.length,
          variantPrices: transformedProduct.variants.map(v => ({ name: v.name, price: v.price }))
        });
        
        return transformedProduct;
      });
    },
    staleTime: 0, // Siempre refrescar
    cacheTime: 0, // No mantener en cache
  });

  const handleAddToCart = (productId: string, categoryId: string, variantId: string, sku: string, productName: string, variantName: string, price: number) => {
    console.log('🛒 ADDING TO CART:', { 
      productId, 
      categoryId, 
      variantId, 
      sku, 
      productName, 
      variantName, 
      price: `$${price.toLocaleString()}` 
    });
    
    // Verificar precio en tiempo real antes de agregar al carrito
    const product = products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.id === variantId);
    
    if (variant) {
      console.log('🔍 PRICE VERIFICATION:', {
        priceFromComponent: price,
        priceFromProduct: variant.price,
        match: price === variant.price
      });
      
      // Usar siempre el precio de la base de datos
      const actualPrice = variant.price;
      
      const appliedPromotions = calculateItemPromotions(productId, categoryId, actualPrice);
      
      const cartItem: Omit<CartItem, "quantity"> = {
        id: productId,
        productName,
        variantName,
        sku,
        price: actualPrice, // Usar precio actualizado
        variantId,
        categoryId,
        appliedPromotions,
      };

      console.log('✅ CART ITEM CREATED WITH UPDATED PRICE:', cartItem);
      onAddToCart(cartItem);
    } else {
      console.error('❌ VARIANT NOT FOUND:', { variantId, productId });
    }
  };

  // Set first category as default if none selected
  if (categories.length > 0 && !selectedCategory) {
    setSelectedCategory(categories[0].id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Productos</h2>
          <button
            onClick={() => {
              console.log('🔄 MANUAL REFRESH TRIGGERED');
              refetchProducts();
            }}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Actualizar Precios
          </button>
        </div>
        
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
                    <div className="flex-1 p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{product.description}</p>
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
