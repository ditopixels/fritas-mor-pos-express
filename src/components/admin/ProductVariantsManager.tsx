
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Zap, Save, Edit, X, Check } from "lucide-react";
import { Product, ProductOption, ProductVariant, useUpdateProductVariants } from "@/hooks/useProducts";
import { toast } from "sonner";

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
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>(variants);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{name: string; price: number}>({name: '', price: 0});
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: 0,
    option_values: {},
    is_active: true,
  });

  const updateProductVariants = useUpdateProductVariants();

  const handleSaveVariants = async () => {
    try {
      await updateProductVariants.mutateAsync({
        productId: product.id,
        variants: localVariants
      });
      
      onUpdateVariants(localVariants);
      toast.success("Variantes guardadas correctamente");
    } catch (error) {
      console.error('Error guardando variantes:', error);
      toast.error("Error al guardar las variantes");
    }
  };

  const startEditingVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id);
    setEditingValues({
      name: variant.name,
      price: variant.price
    });
  };

  const cancelEditingVariant = () => {
    setEditingVariant(null);
    setEditingValues({name: '', price: 0});
  };

  const saveVariantEdit = async (variantId: string) => {
    const updatedVariants = localVariants.map(variant => 
      variant.id === variantId 
        ? { ...variant, name: editingValues.name, price: editingValues.price }
        : variant
    );
    setLocalVariants(updatedVariants);
    
    try {
      await updateProductVariants.mutateAsync({
        productId: product.id,
        variants: updatedVariants
      });
      
      onUpdateVariants(updatedVariants);
      toast.success("Variante guardada correctamente");
    } catch (error) {
      console.error('Error guardando variante:', error);
      toast.error("Error al guardar la variante");
    }
    
    setEditingVariant(null);
    setEditingValues({name: '', price: 0});
  };

  const updateEditingValue = (field: 'name' | 'price', value: string | number) => {
    setEditingValues(prev => ({
      ...prev,
      [field]: value
    }));
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

    const updatedVariants = [...localVariants, variant];
    setLocalVariants(updatedVariants);
    setNewVariant({
      name: '',
      sku: '',
      price: 0,
      option_values: {},
      is_active: true,
    });
  };

  const generateAllVariants = () => {
    if (options.length === 0) {
      console.log('No hay opciones disponibles para generar variantes');
      return;
    }

    // Generar todas las combinaciones posibles
    const combinations = generateCombinations(options);
    
    // Crear variantes basadas en las combinaciones
    const newVariants = combinations.map((combination, index) => {
      const optionValues: Record<string, string> = {};
      let variantName = product.name;
      let skuParts = [product.name.substring(0, 3).toUpperCase()];

      combination.forEach((value, optionIndex) => {
        const option = options[optionIndex];
        optionValues[option.name] = value;
        variantName += ` - ${value}`;
        skuParts.push(value.substring(0, 2).toUpperCase());
      });

      const sku = `${skuParts.join('-')}-${String(index + 1).padStart(3, '0')}`;

      return {
        id: `temp-${Date.now()}-${index}`,
        product_id: product.id,
        name: variantName,
        sku: sku,
        price: product.base_price || 0,
        option_values: optionValues,
        is_active: true,
      };
    });

    // Filtrar variantes que no existan ya
    const existingCombinations = localVariants.map(v => JSON.stringify(v.option_values));
    const uniqueNewVariants = newVariants.filter(v => 
      !existingCombinations.includes(JSON.stringify(v.option_values))
    );

    if (uniqueNewVariants.length > 0) {
      const updatedVariants = [...localVariants, ...uniqueNewVariants];
      setLocalVariants(updatedVariants);
      console.log(`✅ Se generaron ${uniqueNewVariants.length} nuevas variantes`);
    } else {
      console.log('ℹ️ Todas las combinaciones ya existen como variantes');
    }
  };

  const generateCombinations = (options: ProductOption[]): string[][] => {
    if (options.length === 0) return [[]];
    
    const [firstOption, ...restOptions] = options;
    const restCombinations = generateCombinations(restOptions);
    
    const combinations: string[][] = [];
    
    firstOption.values.forEach(value => {
      restCombinations.forEach(restCombination => {
        combinations.push([value, ...restCombination]);
      });
    });
    
    return combinations;
  };

  const removeVariant = (variantId: string) => {
    const updatedVariants = localVariants.filter(v => v.id !== variantId);
    setLocalVariants(updatedVariants);
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
        <div className="flex justify-between items-center">
          <CardTitle>Variantes del Producto</CardTitle>
          <Button
            onClick={handleSaveVariants}
            disabled={updateProductVariants.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateProductVariants.isPending ? 'Guardando...' : 'Guardar Variantes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botón para generar todas las variaciones */}
        {options.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={generateAllVariants}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Generar Todas las Variaciones
            </Button>
          </div>
        )}

        {/* Lista de variantes existentes */}
        <div className="space-y-2">
          {localVariants.map(variant => (
            <div key={variant.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                {editingVariant === variant.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm">Nombre</Label>
                        <Input
                          value={editingValues.name}
                          onChange={(e) => updateEditingValue('name', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Precio</Label>
                        <Input
                          type="number"
                          value={editingValues.price}
                          onChange={(e) => updateEditingValue('price', Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {variant.sku}
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
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {editingVariant === variant.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveVariantEdit(variant.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingVariant}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditingVariant(variant)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeVariant(variant.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
      </CardContent>
    </Card>
  );
};
