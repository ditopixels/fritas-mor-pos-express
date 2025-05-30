
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Plus, Edit, Trash2, Percent, DollarSign, Calendar, Clock } from "lucide-react";
import { usePromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion } from "@/hooks/usePromotions";
import { AdvancedPromotionForm } from "./AdvancedPromotionForm";
import { useToast } from "@/hooks/use-toast";
import { Promotion } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const PromotionsManagement = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const { data: promotions = [], isLoading } = usePromotions();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const { toast } = useToast();

  const activePromotions = promotions.filter(p => p.isActive);
  const inactivePromotions = promotions.filter(p => !p.isActive);

  const handleCreatePromotion = async (promotionData: Partial<Promotion>) => {
    try {
      await createPromotion.mutateAsync({
        name: promotionData.name!,
        description: promotionData.description,
        type: promotionData.type!,
        value: promotionData.value!,
        applicability: promotionData.applicability!,
        targetIds: promotionData.targetIds,
        conditions: promotionData.conditions || {},
        isActive: promotionData.isActive ?? true,
      });

      toast({
        title: "Promoción creada",
        description: "La promoción se ha creado exitosamente",
      });

      setShowForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la promoción",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePromotion = async (promotionData: Partial<Promotion>) => {
    if (!editingPromotion) return;

    try {
      await updatePromotion.mutateAsync({
        id: editingPromotion.id,
        updates: promotionData,
      });

      toast({
        title: "Promoción actualizada",
        description: "La promoción se ha actualizado exitosamente",
      });

      setEditingPromotion(null);
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la promoción",
        variant: "destructive",
      });
    }
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la promoción "${promotion.name}"?`)) {
      return;
    }

    try {
      await deletePromotion.mutateAsync(promotion.id);
      toast({
        title: "Promoción eliminada",
        description: "La promoción se ha eliminado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la promoción",
        variant: "destructive",
      });
    }
  };

  const formatValue = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `$${value.toLocaleString()}`;
  };

  const formatDateRange = (startDate?: Date, endDate?: Date) => {
    if (!startDate && !endDate) return null;
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM", { locale: es })} - ${format(endDate, "dd/MM", { locale: es })}`;
    }
    if (startDate) return `Desde ${format(startDate, "dd/MM/yyyy", { locale: es })}`;
    if (endDate) return `Hasta ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
  };

  const formatDaysOfWeek = (days?: number[]) => {
    if (!days || days.length === 0) return null;
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return days.map(day => dayNames[day]).join(", ");
  };

  if (showForm) {
    return (
      <AdvancedPromotionForm
        promotion={editingPromotion || undefined}
        onSave={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
        onCancel={() => {
          setShowForm(false);
          setEditingPromotion(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Gestión de Promociones</span>
              </CardTitle>
              <CardDescription>
                Crea y administra promociones y descuentos avanzados
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Promoción
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Activas ({activePromotions.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas ({inactivePromotions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promociones Activas</CardTitle>
              <CardDescription>Promociones actualmente en funcionamiento</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Cargando promociones...</div>
              ) : activePromotions.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay promociones activas actualmente
                </div>
              ) : (
                <div className="grid gap-4">
                  {activePromotions.map((promotion) => (
                    <div key={promotion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{promotion.name}</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {promotion.type === "percentage" ? <Percent className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                              {formatValue(promotion.type, promotion.value)}
                            </Badge>
                          </div>
                          
                          {promotion.description && (
                            <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                            <span>
                              Aplicabilidad: {
                                promotion.applicability === "all" ? "Todos" : 
                                promotion.applicability === "category" ? "Categorías" : "Productos"
                              }
                            </span>
                            
                            {formatDateRange(promotion.conditions.startDate, promotion.conditions.endDate) && (
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDateRange(promotion.conditions.startDate, promotion.conditions.endDate)}
                              </span>
                            )}
                            
                            {formatDaysOfWeek(promotion.conditions.daysOfWeek) && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDaysOfWeek(promotion.conditions.daysOfWeek)}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            Creada: {format(promotion.createdAt, "dd/MM/yyyy", { locale: es })}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPromotion(promotion);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePromotion(promotion)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promociones Inactivas</CardTitle>
              <CardDescription>Promociones pausadas o finalizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Cargando promociones...</div>
              ) : inactivePromotions.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay promociones inactivas
                </div>
              ) : (
                <div className="grid gap-4">
                  {inactivePromotions.map((promotion) => (
                    <div key={promotion.id} className="border rounded-lg p-4 opacity-60">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{promotion.name}</h3>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              {promotion.type === "percentage" ? <Percent className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                              {formatValue(promotion.type, promotion.value)}
                            </Badge>
                          </div>
                          {promotion.description && (
                            <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Aplicabilidad: {promotion.applicability === "all" ? "Todos" : promotion.applicability}</span>
                            <span>Creada: {new Date(promotion.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPromotion(promotion);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePromotion(promotion)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
