import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateProductOption, useDeleteProductOption, useProductOptions } from "@/hooks/useProductOptions";
import { Product } from "@/hooks/useProducts";
import { Plus, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

export const ProductOptionsManager = ({ product }: { product: Product }) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const { data: options, isLoading, refetch } = useProductOptions(product.id);
  const createProductOption = useCreateProductOption();
  const deleteProductOption = useDeleteProductOption();

  const handleCreateOption = async () => {
    if (!newOptionName || !newOptionValues) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const valuesArray = newOptionValues.split(',').map(v => v.trim());

    try {
      await createProductOption.mutateAsync({
        product_id: product.id,
        name: newOptionName,
        values: valuesArray,
        is_required: isRequired,
      });
      setNewOptionName('');
      setNewOptionValues('');
      setIsRequired(false);
      refetch();
      toast({
        title: "Opción creada",
        description: "La opción se ha creado correctamente.",
      });
    } catch (error) {
      console.error('Error creating product option:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la opción.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      await deleteProductOption.mutateAsync(optionId);
      refetch();
      toast({
        title: "Opción eliminada",
        description: "La opción se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting product option:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la opción.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Cargando opciones...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opciones del Producto</CardTitle>
        <CardDescription>
          Administra las opciones de este producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Producto: {product.name} - Precio base: ${(product.base_price || 0).toLocaleString()}
        </p>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="optionName">Nombre de la Opción</Label>
              <Input
                id="optionName"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="optionValues">Valores (separados por coma)</Label>
              <Input
                id="optionValues"
                value={newOptionValues}
                onChange={(e) => setNewOptionValues(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Label htmlFor="isRequired">Requerido</Label>
                <Switch id="isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
              </div>
            </div>
          </div>
          <Button onClick={handleCreateOption}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Opción
          </Button>
        </div>

        <div className="mt-6">
          {options && options.length > 0 ? (
            <ul className="space-y-4">
              {options.map((option) => (
                <li key={option.id} className="border rounded p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{option.name}</h4>
                      <p className="text-sm text-gray-500">
                        Valores: {option.values.join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requerido: {option.is_required ? 'Sí' : 'No'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOption(option.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay opciones creadas para este producto.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
