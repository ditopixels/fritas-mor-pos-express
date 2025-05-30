
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, Tag } from "lucide-react";
import { SalesMetrics } from "./SalesMetrics";
import { CatalogManagement } from "./CatalogManagement";
import { PromotionsManagement } from "./PromotionsManagement";
import { SupabaseOrder } from "@/hooks/useOrders";

interface AdminDashboardProps {
  orders: SupabaseOrder[];
}

export const AdminDashboard = ({ orders }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("metrics");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona tu negocio de manera integral</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="metrics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Promociones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-0">
          <SalesMetrics orders={orders} />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-0">
          <CatalogManagement />
        </TabsContent>

        <TabsContent value="promotions" className="space-y-0">
          <PromotionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
