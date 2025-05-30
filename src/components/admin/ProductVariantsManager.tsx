import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { useProductOptions } from '@/hooks/useProductOptions';
import { Product } from '@/hooks/useProducts';
import { useBulkCreateProductVariants } from '@/hooks/useProductOptions';

interface Combination {
  name: string;
  values: Record<string, string>;
  additionalPrice: number;
}

export const ProductVariantsManager = ({ product }: { product: Product }) => {
  const { data: options, isLoading, isError } = useProductOptions(product.id);
  const [basePrice, setBasePrice] = useState(product.base_price || 0);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const bulkCreateVariants = useBulkCreateProductVariants();

  useEffect(() => {
    if (product.base_price) {
      setBasePrice(product.base_price);
    }
  }, [product.base_price]);

  useEffect(() => {
    if (options && options.length > 0) {
      generateCombinations();
    } else {
      setCombinations([]);
    }
  }, [options]);

  const generateCombinations = () => {
    if (!options || options.length === 0) {
      setCombinations([]);
      return;
    }

    const generate = (index: number, currentCombination: Combination): void => {
      if (index === options.length) {
        setCombinations(prev => [...prev, currentCombination]);
        return;
      }

      const option = options[index];
      option.values.forEach(value => {
        const newCombination: Combination = {
          name: currentCombination.name ? `${currentCombination.name} - ${value}` : value,
          values: { ...currentCombination.values, [option.name]: value },
          additionalPrice: currentCombination.additionalPrice,
        };
        generate(index + 1, newCombination);
      });
    };

    setCombinations([]);
    const initialCombination: Combination = { name: '', values: {}, additionalPrice: 0 };
    generate(0, initialCombination);
  };

  const handleBulkCreate = async () => {
    try {
      const variantData = combinations.map(combination => ({
        product_id: product.id,
        sku: `${product.name.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: combination.name,
        price: basePrice + combination.additionalPrice,
        option_values: combination.values,
        is_active: true,
      }));

      await bulkCreateVariants.mutateAsync(variantData);

      toast({
        title: "Variantes creadas",
        description: "Las variantes se han creado correctamente.",
      });
    } catch (error) {
      console.error('Error creating variants:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las variantes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Cargando opciones...</div>;
  if (isError) return <div>Error al cargar las opciones.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrar Variantes</CardTitle>
        <CardDescription>
          Genera y administra las variantes de tu producto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Producto: {product.name} - Precio base: ${product.base_price || 0}.toLocaleString()}
        </p>

        <div>
          <Label htmlFor="base_price">Precio Base</Label>
          <Input
            id="base_price"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(parseFloat(e.target.value))}
          />
        </div>

        {options && options.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold">Combinaciones Generadas</h4>
            <p className="text-xs text-gray-500">
              Se generarán {combinations.length} variantes basadas en las opciones del producto.
            </p>
            <ul className="mt-2 space-y-1">
              {combinations.map((combination, index) => (
                <li key={index} className="text-gray-700">
                  {combination.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">
            No hay opciones configuradas para este producto. Agrega opciones para generar variantes.
          </p>
        )}

        <Button onClick={handleBulkCreate} disabled={combinations.length === 0 || bulkCreateVariants.isLoading}>
          {bulkCreateVariants.isLoading ? "Creando Variantes..." : "Crear Variantes en Masa"}
        </Button>
      </CardContent>
    </Card>
  );
};
