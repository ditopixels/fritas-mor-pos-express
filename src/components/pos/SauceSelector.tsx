
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface SauceSelectorProps {
  unitIndex: number;
  selectedSauces: string[];
  onSaucesChange: (unitIndex: number, sauces: string[]) => void;
}

const AVAILABLE_SAUCES = [
  'Rosada',
  'Piña',
  'BBQ',
  'Ajo',
  'Tomate',
  'Mayonesa',
  'Mostaza',
  'Maíz',
  'Todas'
];

export const SauceSelector = ({ unitIndex, selectedSauces, onSaucesChange }: SauceSelectorProps) => {
  const handleSauceToggle = (sauce: string) => {
    const updatedSauces = selectedSauces.includes(sauce)
      ? selectedSauces.filter(s => s !== sauce)
      : [...selectedSauces, sauce];
    
    onSaucesChange(unitIndex, updatedSauces);
  };

  return (
    <Card className="mt-2 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-yellow-800">
          Salsas {unitIndex > 0 ? `(Unidad ${unitIndex + 1})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_SAUCES.map((sauce) => (
            <div key={sauce} className="flex items-center space-x-2">
              <Checkbox
                id={`sauce-${unitIndex}-${sauce}`}
                checked={selectedSauces.includes(sauce)}
                onCheckedChange={() => handleSauceToggle(sauce)}
              />
              <label
                htmlFor={`sauce-${unitIndex}-${sauce}`}
                className="text-xs cursor-pointer"
              >
                {sauce}
              </label>
            </div>
          ))}
        </div>
        {selectedSauces.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedSauces.map((sauce) => (
              <Badge key={sauce} variant="secondary" className="text-xs">
                {sauce}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
