
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { Product, ProductVariant } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProductVariantsManagerProps {
  product: Product;
}

export const ProductVariantsManager = ({ product }: ProductVariantsManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState({
    sku: '',
    name: '',
    price: 0,
    option_values: {} as Record<string, string>,
    stock: 0
  });
  
  const queryClient = useQueryClient();

  const resetForm = () => {
    setVariantForm({
      sku: '',
      name: '',
      price: 0,
      option_values: {},
      stock: 0
    });
    setIsAdding(false);
    setEditingVariant(null);
  };

  const handleSaveVariant = async () => {
    try {
      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update({
            sku: variantForm.sku,
            name: variantForm.name,
            price: variantForm.price,
            option_values: variantForm.option_values,
            stock: variantForm.stock
          })
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast.success('Variante actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert({
            product_id: product.id,
            sku: variantForm.sku,
            name: variantForm.name,
            price: variantForm.price,
            option_values: variantForm.option_values,
            stock: variantForm.stock,
            is_active: true
          });

        if (error) throw error;
        toast.success('Variante creada exitosamente');
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      resetForm();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Error al guardar la variante');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', variantId);

      if (error) throw error;
      
      toast.success('Variante eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Error al eliminar la variante');
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setVariantForm({
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      option_values: variant.option_values,
      stock: variant.stock || 0
    });
    setEditingVariant(variant);
    setIsAdding(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Variantes del Producto</CardTitle>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar Variante
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={variantForm.sku}
                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                    placeholder="SKU único"
                  />
                </div>
                <div>
                  <Label htmlFor="variant-name">Nombre</Label>
                  <Input
                    id="variant-name"
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    placeholder="Nombre de la variante"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={variantForm.stock}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveVariant}>
                  {editingVariant ? 'Actualizar' : 'Crear'} Variante
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {product.variants?.map((variant) => (
            <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{variant.name}</span>
                  <Badge variant="outline">{variant.sku}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Precio: ${variant.price.toLocaleString()} 
                  {variant.stock && ` • Stock: ${variant.stock}`}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditVariant(variant)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteVariant(variant.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
