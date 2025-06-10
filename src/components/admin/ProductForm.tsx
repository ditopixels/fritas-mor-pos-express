
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
      setFormData({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        image: product.image || '',
        base_price: product.base_price || 0,
        additional_options: product.additional_options || [],
        is_active: product.is_active,
        display_order: product.display_order,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          updates: {
            ...formData,
            additional_options: JSON.stringify(formData.additional_options),
          }
        });
        toast.success('Producto actualizado correctamente');
      } else {
        await createProductMutation.mutateAsync({
          ...formData,
          additional_options: JSON.stringify(formData.additional_options),
        });
        toast.success('Producto creado correctamente');
      }
      
      if (onSave) onSave();
    } catch (error) {
      toast.error('Error al guardar el producto');
      console.error('Error saving product:', error);
    }
  };

  const handleAdditionalOptionsChange = (options: AdditionalOption[]) => {
    setFormData(prev => ({
      ...prev,
      additional_options: options
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? 'Editar Producto' : 'Crear Producto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="additional">Opciones Adicionales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
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

            <TabsContent value="additional" className="space-y-4">
              <ProductAdditionalOptionsManager
                options={formData.additional_options}
                onChange={handleAdditionalOptionsChange}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
