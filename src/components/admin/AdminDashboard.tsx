
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, Tag, Receipt } from "lucide-react";
import { SalesMetrics } from "./SalesMetrics";
import CatalogManagement from "./CatalogManagement";
import { PromotionsManagement } from "./PromotionsManagement";
import { ExpensesManagement } from "./ExpensesManagement";
export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("metrics");

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gestiona tu negocio de manera integral</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
          <TabsTrigger value="metrics" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Promociones</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Gastos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-0">
          <SalesMetrics />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-0">
          <CatalogManagement />
        </TabsContent>

        <TabsContent value="promotions" className="space-y-0">
          <PromotionsManagement />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-0">
          <ExpensesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
