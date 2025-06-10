
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
import { ProductAttachmentsManager } from "./ProductAttachmentsManager";
import { Product, ProductOption, ProductVariant, ProductAttachment, useCategories, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { ProductAttachment as TypesProductAttachment } from "@/types";
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

  const [currentOptions, setCurrentOptions] = useState<ProductOption[]>(product?.options || []);
  const [currentVariants, setCurrentVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [currentAttachments, setCurrentAttachments] = useState<TypesProductAttachment[]>([]);

  console.log('📋 ProductForm - Estado inicial:', {
    productId: product?.id,
    productAttachments: product?.attachments,
    currentAttachments: currentAttachments.length,
    formData
  });

  useEffect(() => {
    if (product) {
      setCurrentOptions(product.options || []);
      setCurrentVariants(product.variants || []);
      // Convertir attachments de la base de datos al formato de types
      const convertedAttachments = (product.attachments || []).map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        values: attachment.values || [],
        isRequired: attachment.is_required || false,
      }));
      console.log('🔄 ProductForm - Convertir attachments:', convertedAttachments);
      setCurrentAttachments(convertedAttachments);
    } else {
      setCurrentOptions([]);
      setCurrentVariants([]);
      setCurrentAttachments([]);
    }
  }, [product?.id]);

  const handleAttachmentsUpdate = (attachments: TypesProductAttachment[]) => {
    console.log('📥 ProductForm - Recibiendo attachments actualizados:', attachments);
    setCurrentAttachments(attachments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('📋 FORM SUBMIT - DATOS COMPLETOS ANTES DE ENVIAR:', {
        formData,
        options: currentOptions,
        variants: currentVariants,
        attachments: currentAttachments,
        variantsCount: currentVariants.length,
        attachmentsCount: currentAttachments.length,
        variantsDetailed: currentVariants.map(v => ({
          name: v.name,
          sku: v.sku,
          price: v.price,
          option_values: v.option_values
        }))
      });

      // Convertir attachments de types al formato de la base de datos
      const dbAttachments = currentAttachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        values: attachment.values,
        is_required: attachment.isRequired,
      }));

      // Preparar datos con variantes y attachments explícitos
      const dataToSend = {
        ...formData,
        options: currentOptions,
        variants: currentVariants,
        attachments: dbAttachments
      };

      console.log('🚀 ENVIANDO DATOS A useUpdateProduct:', {
        id: product?.id,
        updates: dataToSend,
        variantsInUpdate: dataToSend.variants,
        attachmentsInUpdate: dataToSend.attachments,
        variantsCount: dataToSend.variants.length,
        attachmentsCount: dataToSend.attachments.length
      });
      
      if (product) {
        // Actualizar producto existente
        await updateProduct.mutateAsync({
          id: product.id,
          updates: dataToSend
        });
        
        toast({
          title: "Producto actualizado",
          description: "El producto se ha actualizado correctamente.",
        });
      } else {
        // Crear nuevo producto
        const newProduct = await createProduct.mutateAsync(formData);
        
        // Si hay opciones, variantes o attachments, actualizar
        if (currentOptions.length > 0 || currentVariants.length > 0 || currentAttachments.length > 0) {
          await updateProduct.mutateAsync({
            id: newProduct.id,
            updates: {
              options: currentOptions,
              variants: currentVariants,
              attachments: dbAttachments,
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
      console.error('❌ ERROR AL GUARDAR:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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

      <ProductOptionsManager
        product={product || { ...formData, id: 'temp' } as Product}
        onUpdateOptions={setCurrentOptions}
      />

      <ProductAttachmentsManager
        product={product || { ...formData, id: 'temp', attachments: [] } as Product}
        onUpdateAttachments={handleAttachmentsUpdate}
      />

      <ProductVariantsManager
        product={product || { ...formData, id: 'temp' } as Product}
        options={currentOptions}
        variants={currentVariants}
        onUpdateVariants={setCurrentVariants}
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

      <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
        <strong>Debug ProductForm:</strong><br/>
        Opciones: {currentOptions.length} | Variantes: {currentVariants.length} | Attachments: {currentAttachments.length}<br/>
        {currentVariants.length > 0 && (
          <>
            Variantes: {currentVariants.map(v => v.name).join(', ')}<br/>
            SKUs: {currentVariants.map(v => v.sku).join(', ')}
          </>
        )}
        {currentAttachments.length > 0 && (
          <>
            <br/>Attachments: {currentAttachments.map(a => a.name).join(', ')}
          </>
        )}
      </div>
    </form>
  );
};
