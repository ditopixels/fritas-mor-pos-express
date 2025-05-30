
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Plus, Edit, Trash2, Percent, DollarSign } from "lucide-react";

export const PromotionsManagement = () => {
  const [activeTab, setActiveTab] = useState("active");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Gestión de Promociones</span>
          </CardTitle>
          <CardDescription>
            Crea y administra promociones y descuentos
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas</TabsTrigger>
          <TabsTrigger value="create">Crear Nueva</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promociones Activas</CardTitle>
              <CardDescription>Promociones actualmente en funcionamiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Lista de Promociones</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Promoción
                </Button>
              </div>
              <div className="text-gray-500 text-center py-8">
                No hay promociones activas actualmente
              </div>
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
              <div className="text-gray-500 text-center py-8">
                No hay promociones inactivas
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Promoción</CardTitle>
              <CardDescription>Define una nueva promoción o descuento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 cursor-pointer hover:bg-gray-50 border-2 border-dashed">
                    <div className="flex items-center space-x-3">
                      <Percent className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">Descuento Porcentual</h4>
                        <p className="text-sm text-gray-600">Descuento por porcentaje</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 cursor-pointer hover:bg-gray-50 border-2 border-dashed">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div>
                        <h4 className="font-semibold">Descuento Fijo</h4>
                        <p className="text-sm text-gray-600">Monto fijo de descuento</p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="text-gray-500 text-center py-4">
                  Formulario de creación de promociones próximamente
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
