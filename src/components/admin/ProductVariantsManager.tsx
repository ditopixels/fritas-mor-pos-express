
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Zap } from "lucide-react";
import { Product, ProductOption, ProductVariant } from "@/hooks/useProducts";

interface ProductVariantsManagerProps {
  product: Product;
  options: ProductOption[];
  variants: ProductVariant[];
  onUpdateVariants: (variants: ProductVariant[]) => void;
}

export const ProductVariantsManager = ({ 
  product, 
  options, 
  variants, 
  onUpdateVariants 
}: ProductVariantsManagerProps) => {
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: 0,
    option_values: {},
    is_active: true,
  });

  const generateAllCombinations = () => {
    if (options.length === 0) return;

    // Generar todas las combinaciones posibles
    const combinations: Array<Record<string, string>> = [{}];
    
    options.forEach(option => {
      const newCombinations: Array<Record<string, string>> = [];
      option.values.forEach(value => {
        combinations.forEach(combo => {
          newCombinations.push({ ...combo, [option.name]: value });
        });
      });
      combinations.splice(0, combinations.length, ...newCombinations);
    });

    // Crear variantes para cada combinación
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      const name = Object.values(combo).join(' - ');
      const sku = `${product.name.substring(0, 3).toUpperCase()}-${Object.values(combo).join('-').replace(/\s+/g, '').toUpperCase()}-${Date.now()}-${index}`;
      
      return {
        id: `temp-${Date.now()}-${index}`,
        product_id: product.id,
        name,
        sku,
        price: product.base_price || 0,
        option_values: combo,
        is_active: true,
      };
    });

    onUpdateVariants([...variants, ...newVariants]);
  };

  const addVariant = () => {
    if (!newVariant.name || !newVariant.sku || !newVariant.price) return;

    const variant: ProductVariant = {
      id: `temp-${Date.now()}`,
      product_id: product.id,
      name: newVariant.name,
      sku: newVariant.sku,
      price: newVariant.price,
      option_values: newVariant.option_values || {},
      is_active: true,
    };

    onUpdateVariants([...variants, variant]);
    setNewVariant({
      name: '',
      sku: '',
      price: 0,
      option_values: {},
      is_active: true,
    });
  };

  const removeVariant = (variantId: string) => {
    onUpdateVariants(variants.filter(v => v.id !== variantId));
  };

  const updateVariantOptionValue = (optionName: string, value: string) => {
    setNewVariant(prev => ({
      ...prev,
      option_values: {
        ...prev.option_values,
        [optionName]: value
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Variantes del Producto
          {options.length > 0 && (
            <Button
              onClick={generateAllCombinations}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generar Todas las Combinaciones
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de variantes existentes */}
        <div className="space-y-2">
          {variants.map(variant => (
            <div key={variant.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{variant.name}</div>
                <div className="text-sm text-gray-500">
                  SKU: {variant.sku} • Precio: ${variant.price.toLocaleString()}
                </div>
                {Object.keys(variant.option_values).length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {Object.entries(variant.option_values).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeVariant(variant.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Formulario para nueva variante */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium">Agregar Nueva Variante</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="variant-name">Nombre</Label>
              <Input
                id="variant-name"
                placeholder="Ej: Papa Grande"
                value={newVariant.name}
                onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="variant-sku">SKU</Label>
              <Input
                id="variant-sku"
                placeholder="Ej: PAPA-GR-001"
                value={newVariant.sku}
                onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="variant-price">Precio</Label>
            <Input
              id="variant-price"
              type="number"
              placeholder="0"
              value={newVariant.price || ''}
              onChange={(e) => setNewVariant(prev => ({ ...prev, price: Number(e.target.value) }))}
            />
          </div>

          {/* Opciones del producto */}
          {options.length > 0 && (
            <div className="space-y-2">
              <Label>Valores de Opciones</Label>
              {options.map(option => (
                <div key={option.id}>
                  <Label className="text-sm">{option.name}</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {option.values.map(value => (
                      <Button
                        key={value}
                        size="sm"
                        variant={newVariant.option_values?.[option.name] === value ? "default" : "outline"}
                        onClick={() => updateVariantOptionValue(option.name, value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={addVariant}
            disabled={!newVariant.name || !newVariant.sku || !newVariant.price}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Variante
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
