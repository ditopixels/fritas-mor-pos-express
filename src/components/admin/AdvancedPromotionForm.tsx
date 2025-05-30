
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { Promotion } from "@/types";

interface AdvancedPromotionFormProps {
  promotion?: Promotion;
  onSave: (promotion: Partial<Promotion>) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export const AdvancedPromotionForm = ({ promotion, onSave, onCancel }: AdvancedPromotionFormProps) => {
  const [formData, setFormData] = useState({
    name: promotion?.name || "",
    description: promotion?.description || "",
    type: promotion?.type || "percentage" as "percentage" | "fixed",
    value: promotion?.value || 0,
    applicability: promotion?.applicability || "all" as "all" | "category" | "product",
    targetIds: promotion?.targetIds || [],
    isActive: promotion?.isActive ?? true,
    // Condiciones
    startDate: promotion?.conditions?.startDate || undefined,
    endDate: promotion?.conditions?.endDate || undefined,
    daysOfWeek: promotion?.conditions?.daysOfWeek || [],
    minimumPurchase: promotion?.conditions?.minimumPurchase || 0,
  });

  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
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

    if (formData.applicability !== "all" && formData.targetIds.length === 0) {
      toast({
        title: "Error",
        description: `Debe seleccionar al menos un${formData.applicability === "category" ? "a categoría" : " producto"}`,
        variant: "destructive",
      });
      return;
    }

    onSave({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      value: formData.value,
      applicability: formData.applicability,
      targetIds: formData.applicability === "all" ? undefined : formData.targetIds,
      isActive: formData.isActive,
      conditions: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined,
        minimumPurchase: formData.minimumPurchase > 0 ? formData.minimumPurchase : undefined,
      },
    });
  };

  const handleTargetSelection = (targetId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      targetIds: checked 
        ? [...prev.targetIds, targetId]
        : prev.targetIds.filter(id => id !== targetId)
    }));
  };

  const handleDaySelection = (dayValue: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: checked 
        ? [...prev.daysOfWeek, dayValue]
        : prev.daysOfWeek.filter(day => day !== dayValue)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {promotion ? "Editar Promoción" : "Nueva Promoción"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Básica</h3>
            
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
          </div>

          {/* Aplicabilidad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Aplicabilidad</h3>
            
            <div>
              <Label htmlFor="applicability">Aplicar a</Label>
              <Select
                value={formData.applicability}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  applicability: value as "all" | "category" | "product",
                  targetIds: [] // Limpiar selecciones anteriores
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  <SelectItem value="category">Categorías específicas</SelectItem>
                  <SelectItem value="product">Productos específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applicability === "category" && (
              <div>
                <Label>Seleccionar Categorías</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.targetIds.includes(category.id)}
                        onCheckedChange={(checked) => handleTargetSelection(category.id, !!checked)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.applicability === "product" && (
              <div>
                <Label>Seleccionar Productos</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={formData.targetIds.includes(product.id)}
                        onCheckedChange={(checked) => handleTargetSelection(product.id, !!checked)}
                      />
                      <Label htmlFor={`product-${product.id}`} className="text-sm">
                        {product.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Condiciones temporales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Condiciones Temporales</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Fecha de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Días de la semana</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.daysOfWeek.includes(day.value)}
                      onCheckedChange={(checked) => handleDaySelection(day.value, !!checked)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="minimumPurchase">Compra mínima ($)</Label>
              <Input
                id="minimumPurchase"
                type="number"
                value={formData.minimumPurchase}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumPurchase: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
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
