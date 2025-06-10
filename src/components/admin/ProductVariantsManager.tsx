
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Zap, Edit2, Save, X } from "lucide-react";
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
  // Estado local para manejar variantes temporalmente
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>([]);

  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: 0,
    option_values: {},
    is_active: true,
  });

  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editedVariant, setEditedVariant] = useState<Partial<ProductVariant>>({});

  // Sincronizar con props
  useEffect(() => {
    console.log('🔄 SYNC: Recibiendo variantes:', variants.length);
    setLocalVariants([...variants]);
  }, [variants]);

  // Función para actualizar y notificar al padre
  const updateAndNotify = (newVariants: ProductVariant[]) => {
    console.log('📤 ENVIANDO AL PADRE:', newVariants.length, 'variantes');
    setLocalVariants(newVariants);
    onUpdateVariants(newVariants);
  };

  const generateAllCombinations = () => {
    if (options.length === 0) return;

    console.log('⚡ GENERANDO COMBINACIONES para', options.length, 'opciones');

    // Generar todas las combinaciones
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

    // Crear variantes
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

    console.log('✨ GENERADAS', newVariants.length, 'variantes');
    updateAndNotify(newVariants);
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

    console.log('➕ AGREGANDO VARIANTE:', variant.name);
    updateAndNotify([...localVariants, variant]);
    
    setNewVariant({
      name: '',
      sku: '',
      price: 0,
      option_values: {},
      is_active: true,
    });
  };

  const removeVariant = (variantId: string) => {
    console.log('🗑️ ELIMINANDO VARIANTE:', variantId);
    updateAndNotify(localVariants.filter(v => v.id !== variantId));
  };

  const startEditingVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id);
    setEditedVariant({ ...variant });
  };

  const saveEditedVariant = () => {
    if (!editingVariant || !editedVariant.name || !editedVariant.sku || !editedVariant.price) return;

    const updatedVariants = localVariants.map(v => 
      v.id === editingVariant 
        ? { ...v, ...editedVariant, price: Number(editedVariant.price) }
        : v
    );
    
    console.log('💾 GUARDANDO VARIANTE EDITADA');
    updateAndNotify(updatedVariants);
    setEditingVariant(null);
    setEditedVariant({});
  };

  const cancelEditing = () => {
    setEditingVariant(null);
    setEditedVariant({});
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
        {/* Lista de variantes */}
        <div className="space-y-2">
          {localVariants.map(variant => (
            <div key={variant.id} className="flex items-center justify-between p-3 border rounded">
              {editingVariant === variant.id ? (
                <div className="flex-1 grid grid-cols-3 gap-2 mr-2">
                  <Input
                    placeholder="Nombre"
                    value={editedVariant.name || ''}
                    onChange={(e) => setEditedVariant(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="SKU"
                    value={editedVariant.sku || ''}
                    onChange={(e) => setEditedVariant(prev => ({ ...prev, sku: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={editedVariant.price || ''}
                    onChange={(e) => setEditedVariant(prev => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
              ) : (
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
              )}
              
              <div className="flex gap-1">
                {editingVariant === variant.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveEditedVariant}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingVariant(variant)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
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

        {/* Debug simplificado */}
        <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
          <strong>Debug VariantsManager:</strong><br/>
          Local: {localVariants.length} | Props: {variants.length}<br/>
          {localVariants.length > 0 && (
            <>Nombres: {localVariants.map(v => v.name).join(', ')}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
