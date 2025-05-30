
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Product, ProductOption } from "@/hooks/useProducts";

interface ProductOptionsManagerProps {
  product: Product;
  onClose: () => void;
}

export const ProductOptionsManager = ({ product, onClose }: ProductOptionsManagerProps) => {
  const [options, setOptions] = useState<ProductOption[]>(product.options || []);
  const [newOption, setNewOption] = useState<Partial<ProductOption>>({
    name: "",
    values: [],
    is_required: false,
  });
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newAdditionalPrice, setNewAdditionalPrice] = useState<number>(0);

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    
    const currentOption = editingOption || newOption;
    const updatedValues = [...(currentOption.values || []), newValue.trim()];
    
    if (editingOption) {
      setEditingOption({ ...editingOption, values: updatedValues });
    } else {
      setNewOption({ ...newOption, values: updatedValues });
    }
    
    setNewValue("");
    setNewAdditionalPrice(0);
  };

  const handleRemoveValue = (valueToRemove: string) => {
    const currentOption = editingOption || newOption;
    const updatedValues = (currentOption.values || []).filter(v => v !== valueToRemove);
    
    if (editingOption) {
      setEditingOption({ ...editingOption, values: updatedValues });
    } else {
      setNewOption({ ...newOption, values: updatedValues });
    }
  };

  const handleSaveOption = () => {
    const optionToSave = editingOption || newOption;
    
    if (!optionToSave.name || !optionToSave.values || optionToSave.values.length === 0) {
      return;
    }

    if (editingOption) {
      setOptions(options.map(opt => opt.id === editingOption.id ? editingOption : opt));
      setEditingOption(null);
    } else {
      const newOpt: ProductOption = {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        name: optionToSave.name,
        values: optionToSave.values,
        is_required: optionToSave.is_required || false,
      };
      setOptions([...options, newOpt]);
    }

    setNewOption({ name: "", values: [], is_required: false });
  };

  const handleDeleteOption = (optionId: string) => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleEditOption = (option: ProductOption) => {
    setEditingOption({ ...option });
  };

  const handleCancelEdit = () => {
    setEditingOption(null);
    setNewOption({ name: "", values: [], is_required: false });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configurar Opciones - {product.name}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opciones existentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Opciones Configuradas</h3>
            {options.map((option) => (
              <Card key={option.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{option.name}</h4>
                    <Badge variant={option.is_required ? "default" : "secondary"}>
                      {option.is_required ? "Requerido" : "Opcional"}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditOption(option)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteOption(option.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value, index) => (
                    <Badge key={index} variant="outline">
                      {value}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Formulario para nueva opción o editar */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingOption ? "Editar Opción" : "Nueva Opción"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="optionName">Nombre de la Opción</Label>
                <Input
                  id="optionName"
                  value={editingOption?.name || newOption.name || ""}
                  onChange={(e) => {
                    if (editingOption) {
                      setEditingOption({ ...editingOption, name: e.target.value });
                    } else {
                      setNewOption({ ...newOption, name: e.target.value });
                    }
                  }}
                  placeholder="Ej: Tamaño, Salsa, Adiciones"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingOption?.is_required || newOption.is_required || false}
                  onCheckedChange={(checked) => {
                    if (editingOption) {
                      setEditingOption({ ...editingOption, is_required: checked });
                    } else {
                      setNewOption({ ...newOption, is_required: checked });
                    }
                  }}
                />
                <Label>Opción requerida</Label>
              </div>

              <div>
                <Label>Valores de la Opción</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Ej: Pequeño, Mediano, Grande"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                  />
                  <Input
                    type="number"
                    value={newAdditionalPrice}
                    onChange={(e) => setNewAdditionalPrice(Number(e.target.value))}
                    placeholder="Precio adicional"
                    className="w-32"
                  />
                  <Button onClick={handleAddValue}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingOption?.values || newOption.values || []).map((value, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      {value}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveValue(value)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveOption}>
                  {editingOption ? "Actualizar Opción" : "Agregar Opción"}
                </Button>
                {editingOption && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={() => {
              // Aquí implementarías la lógica para guardar las opciones en la base de datos
              console.log("Guardando opciones:", options);
              onClose();
            }}>
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
