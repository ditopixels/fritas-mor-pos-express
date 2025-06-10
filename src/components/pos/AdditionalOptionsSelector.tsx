
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdditionalOption } from "@/types";

interface AdditionalOptionsSelectorProps {
  additionalOptions: AdditionalOption[];
  onSelectionsChange: (selections: string) => void;
}

export const AdditionalOptionsSelector = ({ 
  additionalOptions, 
  onSelectionsChange 
}: AdditionalOptionsSelectorProps) => {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const handleOptionChange = (optionName: string, values: string[], multiple: boolean) => {
    const newSelections = { ...selections };
    
    if (multiple) {
      newSelections[optionName] = values;
    } else {
      newSelections[optionName] = values.length > 0 ? [values[values.length - 1]] : [];
    }
    
    setSelections(newSelections);
    
    // Formatear las selecciones como string
    const formattedSelections = Object.entries(newSelections)
      .filter(([_, vals]) => vals.length > 0)
      .map(([name, vals]) => `${name}: ${vals.join(', ')}`)
      .join(' / ');
    
    onSelectionsChange(formattedSelections);
  };

  if (!additionalOptions || additionalOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-sm font-medium text-gray-700">Opciones Adicionales</Label>
      
      {additionalOptions.map((option, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              {option.name}
              {option.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {option.multiple && (
              <Badge variant="secondary" className="text-xs">
                Múltiple
              </Badge>
            )}
          </div>
          
          {option.multiple ? (
            <div className="flex flex-wrap gap-2">
              {option.options.map((value, valueIndex) => {
                const isSelected = selections[option.name]?.includes(value) || false;
                return (
                  <Button
                    key={valueIndex}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      const currentValues = selections[option.name] || [];
                      let newValues;
                      
                      if (isSelected) {
                        newValues = currentValues.filter(v => v !== value);
                      } else {
                        newValues = [...currentValues, value];
                      }
                      
                      handleOptionChange(option.name, newValues, true);
                    }}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          ) : (
            <ToggleGroup
              type="single"
              value={selections[option.name]?.[0] || ""}
              onValueChange={(value) => 
                handleOptionChange(option.name, value ? [value] : [], false)
              }
              className="flex flex-wrap gap-2 justify-start"
            >
              {option.options.map((value, valueIndex) => (
                <ToggleGroupItem
                  key={valueIndex}
                  value={value}
                  className="border border-gray-300 hover:bg-gray-100 data-[state=on]:bg-yellow-500 data-[state=on]:text-white text-xs px-3 py-2 h-auto"
                >
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
      ))}
    </div>
  );
};
