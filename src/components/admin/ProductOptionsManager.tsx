import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { ProductVariantsManager } from "./ProductVariantsManager";
import { useProductOptions, useProductVariants, useCreateProductOption, useCreateProductVariant, useBulkCreateProductVariants } from "@/hooks/useProductOptions";
import { useToast } from "@/hooks/use-toast";

interface ProductOptionsManagerProps {
  product: Product;
  onClose: () => void;
}

export const ProductOptionsManager = ({ product, onClose }: ProductOptionsManagerProps) => {
  const [options, setOptions] = useState(product.options || []);
  const [variants, setVariants] = useState(product.variants || []);
  const [newOption, setNewOption] = useState({
    name: '',
    values: [''],
    is_required: false,
  });

  const { toast } = useToast();
  const createOptionMutation = useCreateProductOption();
  const createVariantMutation = useCreateProductVariant();
  const bulkCreateVariantsMutation = useBulkCreateProductVariants();

  const addValueToNewOption = () => {
    setNewOption(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const updateNewOptionValue = (index: number, value: string) => {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  const removeValueFromNewOption = (index: number) => {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const addOption = async () => {
    if (!newOption.name || newOption.values.some(v => !v.trim())) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos de la opción",
        variant: "destructive",
      });
      return;
    }

    try {
      const cleanValues = newOption.values.filter(v => v.trim()).map(v => v.trim());
      
      await createOptionMutation.mutateAsync({
        product_id: product.id,
        name: newOption.name,
        values: cleanValues,
        is_required: newOption.is_required,
      });

      const newOptionData = {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        name: newOption.name,
        values: cleanValues,
        is_required: newOption.is_required,
      };

      setOptions(prev => [...prev, newOptionData]);
      setNewOption({ name: '', values: [''], is_required: false });
      
      toast({
        title: "Opción agregada",
        description: `La opción "${newOption.name}" ha sido agregada exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la opción",
        variant: "destructive",
      });
    }
  };

  const generateVariants = () => {
    if (options.length === 0) return;

    const combinations: Array<Record<string, string>> = [{}];

    options.forEach(option => {
      const newCombinations: Array<Record<string, string>> = [];
      combinations.forEach(combination => {
        option.values.forEach(value => {
          newCombinations.push({
            ...combination,
            [option.name]: value
          });
        });
      });
      combinations.splice(0, combinations.length, ...newCombinations);
    });

    const basePrice = product.base_price || 5000;
    const newVariants = combinations.map((combo, index) => {
      const name = Object.values(combo).join(' - ');
      const sku = `${product.id}-${Object.values(combo).join('-').toLowerCase().replace(/\s+/g, '-')}-${index}`;
      
      return {
        id: `temp-${Date.now()}-${index}`,
        product_id: product.id,
        sku,
        name,
        price: basePrice,
        option_values: combo,
        is_active: true,
      };
    });

    setVariants(newVariants);
    toast({
      title: "Variantes generadas",
      description: `Se generaron ${newVariants.length} variantes basadas en las opciones`,
    });
  };

  const saveVariants = async () => {
    if (variants.length === 0) return;

    try {
      const variantsToCreate = variants
        .filter(v => v.id.startsWith('temp-'))
        .map(v => ({
          product_id: product.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          option_values: v.option_values,
          is_active: v.is_active,
          stock: v.stock,
        }));

      if (variantsToCreate.length > 0) {
        await bulkCreateVariantsMutation.mutateAsync(variantsToCreate);
        toast({
          title: "Variantes guardadas",
          description: `Se guardaron ${variantsToCreate.length} variantes exitosamente`,
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las variantes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Opciones del Producto: {product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opciones existentes */}
          <div className="space-y-2">
            {options.map(option => (
              <div key={option.id} className="p-3 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{option.name}</div>
                  {option.is_required && (
                    <Badge variant="secondary">Requerido</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {option.values.map(value => (
                    <Badge key={value} variant="outline">{value}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Nueva opción */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Agregar Nueva Opción</h4>
            
            <div>
              <Label htmlFor="option-name">Nombre de la Opción</Label>
              <Input
                id="option-name"
                placeholder="Ej: Tamaño"
                value={newOption.name}
                onChange={(e) => setNewOption(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Valores</Label>
              <div className="space-y-2">
                {newOption.values.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ej: Grande"
                      value={value}
                      onChange={(e) => updateNewOptionValue(index, e.target.value)}
                    />
                    {newOption.values.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeValueFromNewOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addValueToNewOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Valor
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={newOption.is_required}
                onCheckedChange={(checked) => setNewOption(prev => ({ ...prev, is_required: checked }))}
              />
              <Label htmlFor="required">Opción requerida</Label>
            </div>

            <Button onClick={addOption} className="w-full">
              Agregar Opción
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Administrador de variantes */}
      <ProductVariantsManager
        product={product}
        options={options}
        variants={variants}
        onUpdateVariants={setVariants}
      />

      {/* Acciones */}
      <div className="flex gap-3">
        {options.length > 0 && (
          <Button onClick={generateVariants} variant="outline">
            Generar Variantes Automáticamente
          </Button>
        )}
        <Button onClick={saveVariants} className="flex-1">
          Guardar Cambios
        </Button>
        <Button onClick={onClose} variant="outline">
          Cerrar
        </Button>
      </div>
    </div>
  );
};
