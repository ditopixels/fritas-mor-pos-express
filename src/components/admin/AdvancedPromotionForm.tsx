
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, DollarSign, Percent } from "lucide-react";
import { useCategories, useAllProducts } from "@/hooks/useProducts";
import { Promotion } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdvancedPromotionFormProps {
  promotion?: Promotion;
  onSave: (promotion: Partial<Promotion>) => void;
  onCancel: () => void;
}

export const AdvancedPromotionForm = ({ promotion, onSave, onCancel }: AdvancedPromotionFormProps) => {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useAllProducts();

  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    applicability: "all",
    targetIds: [],
    conditions: {
      daysOfWeek: [],
      startDate: undefined,
      endDate: undefined,
      paymentMethods: [],
      minimumPurchase: 0,
      minimumQuantity: 1,
    },
    isActive: true,
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        ...promotion,
        conditions: {
          ...promotion.conditions,
          minimumQuantity: promotion.conditions.minimumQuantity || 1,
        },
      });
    }
  }, [promotion]);

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const paymentMethods = ["Efectivo", "Tarjeta", "Transferencia", "QR"];

  const handleDayToggle = (day: number) => {
    const currentDays = formData.conditions?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        daysOfWeek: newDays,
      },
    });
  };

  const handleSelectAllDays = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    const currentDays = formData.conditions?.daysOfWeek || [];
    const isAllSelected = allDays.every(day => currentDays.includes(day));
    
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        daysOfWeek: isAllSelected ? [] : allDays,
      },
    });
  };

  const handlePaymentMethodToggle = (method: string) => {
    const currentMethods = formData.conditions?.paymentMethods || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        paymentMethods: newMethods,
      },
    });
  };

  const handleTargetIdToggle = (id: string) => {
    const currentIds = formData.targetIds || [];
    const newIds = currentIds.includes(id)
      ? currentIds.filter(i => i !== id)
      : [...currentIds, id];
    
    setFormData({
      ...formData,
      targetIds: newIds,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTargetOptions = () => {
    if (formData.applicability === "category") {
      return categories;
    } else if (formData.applicability === "product") {
      return products;
    }
    return [];
  };

  return (
    <div className="space-y-6">
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
                <Label htmlFor="name">Nombre de la Promoción</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Descuento</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center space-x-2">
                          <Percent className="h-4 w-4" />
                          <span>Porcentaje</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Valor Fijo</span>
                        </div>
                      </SelectItem>
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
                    min="0"
                    step={formData.type === "percentage" ? "1" : "100"}
                    max={formData.type === "percentage" ? "100" : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    required
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
                  onValueChange={(value: "all" | "category" | "product") => {
                    setFormData({ ...formData, applicability: value, targetIds: [] });
                  }}
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

              {formData.applicability !== "all" && (
                <div>
                  <Label>
                    Seleccionar {formData.applicability === "category" ? "Categorías" : "Productos"}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {getTargetOptions().map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.targetIds?.includes(option.id) || false}
                          onCheckedChange={() => handleTargetIdToggle(option.id)}
                        />
                        <Label className="text-sm">{option.name}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.targetIds && formData.targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.targetIds.map((id) => {
                        const item = getTargetOptions().find(o => o.id === id);
                        return item ? (
                          <Badge key={id} variant="secondary">
                            {item.name}
                            <X 
                              className="h-3 w-3 ml-1 cursor-pointer" 
                              onClick={() => handleTargetIdToggle(id)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Condiciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Condiciones</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumPurchase">Compra Mínima ($)</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.conditions?.minimumPurchase || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        minimumPurchase: Number(e.target.value),
                      },
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="minimumQuantity">Cantidad Mínima de Items</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    min="1"
                    value={formData.conditions?.minimumQuantity || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        minimumQuantity: Number(e.target.value),
                      },
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.conditions?.startDate ? 
                      format(formData.conditions.startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        startDate: e.target.value ? new Date(e.target.value) : undefined,
                      },
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.conditions?.endDate ? 
                      format(formData.conditions.endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        endDate: e.target.value ? new Date(e.target.value) : undefined,
                      },
                    })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Días de la Semana</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDays}
                  >
                    {dayNames.every((_, index) => 
                      formData.conditions?.daysOfWeek?.includes(index)
                    ) ? "Deseleccionar todos" : "Seleccionar todos"}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {dayNames.map((day, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.conditions?.daysOfWeek?.includes(index) || false}
                        onCheckedChange={() => handleDayToggle(index)}
                      />
                      <Label className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Métodos de Pago</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.conditions?.paymentMethods?.includes(method) || false}
                        onCheckedChange={() => handlePaymentMethodToggle(method)}
                      />
                      <Label className="text-sm">{method}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive || false}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Promoción Activa</Label>
            </div>

            {/* Botones */}
            <div className="flex space-x-2">
              <Button type="submit">
                {promotion ? "Actualizar Promoción" : "Crear Promoción"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
