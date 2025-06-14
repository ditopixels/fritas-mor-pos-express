
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, Tag, Receipt } from "lucide-react";
import { SalesMetrics } from "./SalesMetrics";
import CatalogManagement from "./CatalogManagement";
import { PromotionsManagement } from "./PromotionsManagement";
import { ExpensesManagement } from "./ExpensesManagement";
import { SupabaseOrder } from "@/hooks/useOrders";
import { Order } from "@/types";

interface AdminDashboardProps {
  orders: SupabaseOrder[];
}

// Helper function to safely parse JSON
const safeJsonParse = (jsonString: any): any[] => {
  if (!jsonString || jsonString === '' || jsonString === null || jsonString === undefined) {
    return [];
  }
  
  try {
    if (typeof jsonString === 'string') {
      return JSON.parse(jsonString);
    }
    // If it's already an object/array, return it as is
    if (Array.isArray(jsonString) || typeof jsonString === 'object') {
      return jsonString;
    }
    return [];
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return [];
  }
};

// Función para transformar SupabaseOrder a Order
const transformSupabaseOrderToOrder = (supabaseOrder: SupabaseOrder): Order => {
  return {
    id: supabaseOrder.id,
    items: supabaseOrder.order_items?.map(item => ({
      id: item.id,
      productName: item.product_name,
      variantName: item.variant_name,
      sku: item.sku,
      price: item.price,
      originalPrice: item.original_price || item.price,
      quantity: item.quantity,
      appliedPromotions: safeJsonParse(item.applied_promotions)
    })) || [],
    total: supabaseOrder.total,
    subtotal: supabaseOrder.subtotal,
    totalDiscount: supabaseOrder.total_discount,
    paymentMethod: supabaseOrder.payment_method,
    customerName: supabaseOrder.customer_name,
    cashReceived: supabaseOrder.cash_received,
    photoEvidence: supabaseOrder.photo_evidence,
    createdAt: new Date(supabaseOrder.created_at),
    status: supabaseOrder.status,
    appliedPromotions: safeJsonParse(supabaseOrder.applied_promotions)
  };
};

export const AdminDashboard = ({ orders }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("metrics");

  // Transformar las órdenes de Supabase al formato esperado
  const transformedOrders: Order[] = orders.map(transformSupabaseOrderToOrder);

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
          <SalesMetrics orders={transformedOrders} />
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
