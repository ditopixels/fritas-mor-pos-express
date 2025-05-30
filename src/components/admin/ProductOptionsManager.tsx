
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Product, ProductOption } from "@/hooks/useProducts";
import { X, Plus, Trash2 } from "lucide-react";

interface ProductOptionsManagerProps {
  product: Product;
  onUpdateOptions: (options: ProductOption[]) => void;
}

export const ProductOptionsManager = ({ product, onUpdateOptions }: ProductOptionsManagerProps) => {
  const [options, setOptions] = useState<ProductOption[]>(product.options || []);
  const [newOptionName, setNewOptionName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [newOptionValues, setNewOptionValues] = useState<string[]>([]);
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    onUpdateOptions(options);
  }, [options, onUpdateOptions]);

  const handleAddValue = () => {
    if (currentValue.trim() && !newOptionValues.includes(currentValue.trim())) {
      setNewOptionValues([...newOptionValues, currentValue.trim()]);
      setCurrentValue("");
    }
  };

  const handleRemoveValue = (value: string) => {
    setNewOptionValues(newOptionValues.filter(v => v !== value));
  };

  const handleAddOption = () => {
    if (newOptionName.trim() && newOptionValues.length > 0) {
      // Generar un UUID válido para la nueva opción
      const tempId = crypto.randomUUID();
      
      const newOption = {
        id: tempId,
        product_id: product.id,
        name: newOptionName.trim(),
        values: newOptionValues,
        is_required: isRequired,
        created_at: new Date().toISOString(),
      };

      setOptions(prev => [...prev, newOption]);
      setNewOptionName('');
      setNewOptionValues([]);
      setCurrentValue('');
      setIsRequired(false);
    }
  };

  const handleRemoveOption = (optionId: string) => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Opciones del Producto</h3>
        
        {options.length > 0 ? (
          <div className="space-y-4">
            {options.map(option => (
              <div key={option.id} className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.name}</span>
                    {option.is_required && (
                      <Badge variant="outline" className="text-xs">Requerido</Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {option.values.map(value => (
                    <Badge key={value} variant="secondary">{value}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No hay opciones configuradas para este producto.
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Agregar Nueva Opción</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nombre de la opción (ej: Tamaño)"
              value={newOptionName}
              onChange={e => setNewOptionName(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Checkbox 
                id="required" 
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <label htmlFor="required" className="text-sm">Requerido</label>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Valor (ej: Grande)"
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddValue()}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddValue}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {newOptionValues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {newOptionValues.map(value => (
                <Badge 
                  key={value} 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {value}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveValue(value)}
                  />
                </Badge>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            disabled={!newOptionName.trim() || newOptionValues.length === 0}
            onClick={handleAddOption}
            className="w-full"
          >
            Agregar Opción
          </Button>
        </div>
      </div>
    </div>
  );
};
