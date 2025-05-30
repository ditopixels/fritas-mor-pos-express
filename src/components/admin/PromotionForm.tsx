
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Promotion } from "@/types";

interface PromotionFormProps {
  promotion?: Promotion;
  onSave: (promotion: Partial<Promotion>) => void;
  onCancel: () => void;
}

export const PromotionForm = ({ promotion, onSave, onCancel }: PromotionFormProps) => {
  const [formData, setFormData] = useState({
    name: promotion?.name || "",
    description: promotion?.description || "",
    type: promotion?.type || "percentage",
    value: promotion?.value || 0,
    applicability: promotion?.applicability || "all",
    isActive: promotion?.isActive ?? true,
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la promoción es requerido",
        variant: "destructive",
      });
      return;
    }

    if (formData.value <= 0) {
      toast({
        title: "Error",
        description: "El valor de la promoción debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      conditions: {},
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {promotion ? "Editar Promoción" : "Nueva Promoción"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre de la promoción"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as "percentage" | "fixed" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Monto Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">
                Valor {formData.type === "percentage" ? "(%)" : "($)"}
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step={formData.type === "percentage" ? "1" : "0.01"}
                max={formData.type === "percentage" ? "100" : undefined}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="applicability">Aplicabilidad</Label>
            <Select
              value={formData.applicability}
              onValueChange={(value) => setFormData(prev => ({ ...prev, applicability: value as "all" | "category" | "product" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="category">Por categoría</SelectItem>
                <SelectItem value="product">Producto específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Promoción activa</Label>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              {promotion ? "Actualizar" : "Crear"} Promoción
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
