
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductAdditionalOptionsManager, AdditionalOption } from "./ProductAdditionalOptionsManager";
import { useCategories, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Product } from "@/hooks/useProducts";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Product;
  onSave?: () => void;
  onCancel?: () => void;
}

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    image: '',
    base_price: 0,
    additional_options: [] as AdditionalOption[],
    is_active: true,
    display_order: 0,
  });

  const { data: categories = [] } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  useEffect(() => {
    if (product) {
      console.log('Product data:', product);
      console.log('Additional options from product:', product.additional_options);
      
      let additionalOptions: AdditionalOption[] = [];
      
      // Parsear las opciones adicionales si existen
      if (product.additional_options) {
        try {
          if (typeof product.additional_options === 'string') {
            additionalOptions = JSON.parse(product.additional_options);
          } else if (Array.isArray(product.additional_options)) {
            additionalOptions = product.additional_options;
          }
        } catch (error) {
          console.error('Error parsing additional_options:', error);
          additionalOptions = [];
        }
      }
      
      setFormData({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        image: product.image || '',
        base_price: product.base_price || 0,
        additional_options: additionalOptions,
        is_active: product.is_active,
        display_order: product.display_order,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        additional_options: JSON.stringify(formData.additional_options),
      };
      
      if (product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          updates: submitData
        });
        toast.success('Producto actualizado correctamente');
      } else {
        await createProductMutation.mutateAsync(submitData);
        toast.success('Producto creado correctamente');
      }
      
      if (onSave) onSave();
    } catch (error) {
      toast.error('Error al guardar el producto');
      console.error('Error saving product:', error);
    }
  };

  const handleAdditionalOptionsChange = (options: AdditionalOption[]) => {
    console.log('Additional options changed:', options);
    setFormData(prev => ({
      ...prev,
      additional_options: options
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {product ? 'Editar Producto' : 'Crear Producto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="basic" className="text-sm font-medium">
                Información Básica
              </TabsTrigger>
              <TabsTrigger value="additional" className="text-sm font-medium">
                Opciones Adicionales
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
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

                <div className="space-y-2">
                  <Label htmlFor="price">Precio Base</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Orden de Visualización</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">URL de Imagen</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Producto Activo</Label>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Opciones Adicionales del Producto</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configura opciones adicionales como salsas, extras, etc. que no afectan el SKU del producto.
                </p>
                <ProductAdditionalOptionsManager
                  options={formData.additional_options}
                  onChange={handleAdditionalOptionsChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {product ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
