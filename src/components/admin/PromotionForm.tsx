import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Promotion, useCategories, useProducts, useCreatePromotion, useUpdatePromotion } from "@/hooks/usePromotions";
import { useToast } from "@/hooks/use-toast";

interface PromotionFormProps {
  promotion?: Promotion;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PromotionForm = ({ promotion, onSuccess, onCancel }: PromotionFormProps) => {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: promotion?.name || "",
    description: promotion?.description || "",
    type: promotion?.type || "percentage" as "percentage" | "fixed",
    value: promotion?.value || 0,
    applicability: promotion?.applicability || "all" as "all" | "category" | "product",
    target_id: promotion?.target_id || "",
    is_active: promotion?.is_active ?? true,
    conditions: {
      daysOfWeek: promotion?.conditions.daysOfWeek || [],
      startDate: promotion?.conditions.startDate || undefined,
      endDate: promotion?.conditions.endDate || undefined,
      paymentMethods: promotion?.conditions.paymentMethods || [],
      minimumPurchase: promotion?.conditions.minimumPurchase || undefined,
      minimumQuantity: promotion?.conditions.minimumQuantity || undefined,
    }
  });

  const [daysOfWeek, setDaysOfWeek] = useState(formData.conditions.daysOfWeek || []);
  const [paymentMethods, setPaymentMethods] = useState(formData.conditions.paymentMethods || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const promotionData = {
        ...formData,
        conditions: {
          daysOfWeek: daysOfWeek,
          startDate: formData.conditions.startDate,
          endDate: formData.conditions.endDate,
          paymentMethods: paymentMethods,
          minimumPurchase: formData.conditions.minimumPurchase,
          minimumQuantity: formData.conditions.minimumQuantity,
        }
      };

      if (promotion) {
        await updatePromotion.mutateAsync({ id: promotion.id, updates: promotionData });
        toast({
          title: "Promoción actualizada",
          description: "La promoción se ha actualizado correctamente.",
        });
      } else {
        await createPromotion.mutateAsync(promotionData);
        toast({
          title: "Promoción creada",
          description: "La promoción se ha creado correctamente.",
        });
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la promoción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{promotion ? 'Editar Promoción' : 'Nueva Promoción'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "percentage" | "fixed" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Valor Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="applicability">Aplicabilidad</Label>
            <Select value={formData.applicability} onValueChange={(value) => setFormData({ ...formData, applicability: value as "all" | "category" | "product" })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la aplicabilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="category">Categoría específica</SelectItem>
                <SelectItem value="product">Producto específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.applicability !== 'all' && (
            <div>
              <Label htmlFor="target_id">
                {formData.applicability === 'category' ? 'Selecciona una categoría' : 'Selecciona un producto'}
              </Label>
              <Select
                value={formData.target_id}
                onValueChange={(value) => setFormData({ ...formData, target_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecciona ${formData.applicability === 'category' ? 'una categoría' : 'un producto'}`} />
                </SelectTrigger>
                <SelectContent>
                  {formData.applicability === 'category' ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minimumPurchase">Compra Mínima</Label>
              <Input
                type="number"
                id="minimumPurchase"
                value={formData.conditions.minimumPurchase || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, minimumPurchase: Number(e.target.value) }
                })}
              />
            </div>

            <div>
              <Label htmlFor="minimumQuantity">Cantidad Mínima</Label>
              <Input
                type="number"
                id="minimumQuantity"
                value={formData.conditions.minimumQuantity || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, minimumQuantity: Number(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <Button
                    key={day}
                    variant={daysOfWeek.includes(day) ? "default" : "outline"}
                    onClick={() => toggleDayOfWeek(day)}
                  >
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][day]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Métodos de pago</Label>
              <div className="flex flex-wrap gap-2">
                {["cash", "credit_card", "debit_card", "transfer"].map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethods.includes(method) ? "default" : "outline"}
                    onClick={() => togglePaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                type="date"
                id="startDate"
                value={formData.conditions.startDate ? new Date(formData.conditions.startDate).toISOString().split('T')[0] : ""}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, startDate: e.target.value ? new Date(e.target.value) : undefined }
                })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                type="date"
                id="endDate"
                value={formData.conditions.endDate ? new Date(formData.conditions.endDate).toISOString().split('T')[0] : ""}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, endDate: e.target.value ? new Date(e.target.value) : undefined }
                })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Promoción Activa</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={createPromotion.isPending || updatePromotion.isPending}>
          {createPromotion.isPending || updatePromotion.isPending ? 'Guardando...' : (promotion ? 'Actualizar' : 'Crear')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
