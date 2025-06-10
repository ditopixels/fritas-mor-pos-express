
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductOptionsManager } from "./ProductOptionsManager";
import { ProductVariantsManager } from "./ProductVariantsManager";
import { Product, ProductOption, ProductVariant, useCategories, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    base_price: product?.base_price || 0,
    is_active: product?.is_active ?? true,
  });

  // Estados para opciones y variantes
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Inicializar estados cuando cambie el producto
  useEffect(() => {
    if (product) {
      console.log('🔄 ProductForm - INICIALIZANDO CON PRODUCTO:', {
        productId: product.id,
        productName: product.name,
        optionsFromProduct: product.options?.length || 0,
        variantsFromProduct: product.variants?.length || 0
      });
      
      setOptions(product.options || []);
      setVariants(product.variants || []);
    } else {
      console.log('🆕 ProductForm - NUEVO PRODUCTO, LIMPIANDO ESTADOS');
      setOptions([]);
      setVariants([]);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🚀 ProductForm - SUBMIT INICIADO:', { 
        formData, 
        optionsCount: options.length,
        variantsCount: variants.length,
        variantsData: variants
      });
      
      if (product) {
        // PAYLOAD COMPLETO PARA ACTUALIZACIÓN
        const updatePayload = {
          ...formData,
          options: options,
          variants: variants
        };
        
        console.log('🎯 ProductForm - PAYLOAD FINAL PARA ACTUALIZACIÓN:', {
          id: product.id,
          payload: updatePayload,
          variantsIncluded: !!updatePayload.variants,
          variantsCount: updatePayload.variants.length
        });
        
        await updateProduct.mutateAsync({
          id: product.id,
          updates: updatePayload
        });
        
        toast({
          title: "Producto actualizado",
          description: "El producto se ha actualizado correctamente.",
        });
      } else {
        // Create new product
        const newProduct = await createProduct.mutateAsync(formData);
        
        // If there are options and variants, update the product with them
        if (options.length > 0 || variants.length > 0) {
          await updateProduct.mutateAsync({
            id: newProduct.id,
            updates: {
              options,
              variants,
            }
          });
        }
        
        toast({
          title: "Producto creado",
          description: "El producto se ha creado correctamente.",
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('❌ ProductForm - ERROR AL GUARDAR:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOptions = (newOptions: ProductOption[]) => {
    console.log('📋 ProductForm - ACTUALIZANDO OPCIONES:', {
      previousCount: options.length,
      newCount: newOptions.length
    });
    setOptions(newOptions);
  };

  const handleUpdateVariants = (newVariants: ProductVariant[]) => {
    console.log('🔧 ProductForm - ACTUALIZANDO VARIANTES:', {
      previousCount: variants.length,
      newCount: newVariants.length,
      newVariants: newVariants
    });
    
    setVariants(newVariants);
    
    // Verificar inmediatamente después del setState
    setTimeout(() => {
      console.log('🔧 ProductForm - VARIANTES DESPUÉS DE setState:', {
        variantsLength: variants.length,
        variantsState: variants
      });
    }, 10);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Precio Base</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Producto Activo</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Manager */}
      <ProductOptionsManager
        product={product || { ...formData, id: 'temp' } as Product}
        onUpdateOptions={handleUpdateOptions}
      />

      {/* Variants Manager */}
      <ProductVariantsManager
        product={product || { ...formData, id: 'temp' } as Product}
        options={options}
        variants={variants}
        onUpdateVariants={handleUpdateVariants}
      />

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={createProduct.isPending || updateProduct.isPending}
          className="flex-1"
        >
          {createProduct.isPending || updateProduct.isPending ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
        </Button>
        
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
        <strong>Debug Info ProductForm:</strong><br/>
        Opciones: {options.length} | Variantes: {variants.length}<br/>
        {variants.length > 0 && (
          <>
            Variantes: {variants.map(v => v.name).join(', ')}<br/>
            SKUs: {variants.map(v => v.sku).join(', ')}
          </>
        )}
      </div>
    </form>
  );
};
