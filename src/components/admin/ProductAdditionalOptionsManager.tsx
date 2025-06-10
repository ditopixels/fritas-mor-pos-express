
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, X } from "lucide-react";

export interface AdditionalOption {
  name: string;
  options: string[];
  multiple: boolean;
  required: boolean;
}

interface ProductAdditionalOptionsManagerProps {
  options: AdditionalOption[];
  onChange: (options: AdditionalOption[]) => void;
}

export const ProductAdditionalOptionsManager = ({ options, onChange }: ProductAdditionalOptionsManagerProps) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const addOption = () => {
    if (!newOptionName.trim()) return;
    
    const newOption: AdditionalOption = {
      name: newOptionName.trim(),
      options: [],
      multiple: true,
      required: false
    };
    
    onChange([...options, newOption]);
    setNewOptionName('');
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    onChange(updatedOptions);
  };

  const updateOptionName = (index: number, name: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].name = name;
    onChange(updatedOptions);
  };

  const updateOptionMultiple = (index: number, multiple: boolean) => {
    const updatedOptions = [...options];
    updatedOptions[index].multiple = multiple;
    onChange(updatedOptions);
  };

  const updateOptionRequired = (index: number, required: boolean) => {
    const updatedOptions = [...options];
    updatedOptions[index].required = required;
    onChange(updatedOptions);
  };

  const addOptionValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;
    
    const updatedOptions = [...options];
    updatedOptions[optionIndex].options.push(value.trim());
    onChange(updatedOptions);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const updatedOptions = [...options];
    updatedOptions[optionIndex].options = updatedOptions[optionIndex].options.filter((_, i) => i !== valueIndex);
    onChange(updatedOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Opciones Adicionales</Label>
        <p className="text-sm text-gray-500">
          Opciones que no afectan el SKU (ej: salsas, extras)
        </p>
      </div>

      {/* Agregar nueva opción */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agregar Nueva Opción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre de la opción (ej: Salsas)"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addOption} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de opciones existentes */}
      {options.map((option, optionIndex) => (
        <Card key={optionIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Input
                value={option.name}
                onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                className="font-medium text-base"
                placeholder="Nombre de la opción"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeOption(optionIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuración de la opción */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`multiple-${optionIndex}`}
                  checked={option.multiple}
                  onCheckedChange={(checked) => updateOptionMultiple(optionIndex, !!checked)}
                />
                <Label htmlFor={`multiple-${optionIndex}`} className="text-sm">
                  Selección múltiple
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${optionIndex}`}
                  checked={option.required}
                  onCheckedChange={(checked) => updateOptionRequired(optionIndex, !!checked)}
                />
                <Label htmlFor={`required-${optionIndex}`} className="text-sm">
                  Requerido
                </Label>
              </div>
            </div>

            {/* Agregar valores */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Valores disponibles:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nuevo valor (ej: rosada, bbq)"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addOptionValue(optionIndex, newOptionValue);
                      setNewOptionValue('');
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    addOptionValue(optionIndex, newOptionValue);
                    setNewOptionValue('');
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de valores */}
            {option.options.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {option.options.map((value, valueIndex) => (
                  <div
                    key={valueIndex}
                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                  >
                    <span>{value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeOptionValue(optionIndex, valueIndex)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {options.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay opciones adicionales configuradas
        </div>
      )}
    </div>
  );
};
