
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Package, Tag } from "lucide-react";
import { SalesMetrics } from "./SalesMetrics";
import CatalogManagement from "./CatalogManagement";
import { PromotionsManagement } from "./PromotionsManagement";
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
    order_number: supabaseOrder.order_number,
    customer_name: supabaseOrder.customer_name,
    total: supabaseOrder.total,
    payment_method: supabaseOrder.payment_method,
    created_at: supabaseOrder.created_at,
    status: supabaseOrder.status,
    subtotal: supabaseOrder.subtotal,
    total_discount: supabaseOrder.total_discount,
    cash_received: supabaseOrder.cash_received,
    photo_evidence: supabaseOrder.photo_evidence,
    applied_promotions: safeJsonParse(supabaseOrder.applied_promotions),
    order_items: supabaseOrder.order_items?.map(item => ({
      id: item.id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      price: item.price,
      original_price: item.original_price || item.price,
      quantity: item.quantity,
      applied_promotions: safeJsonParse(item.applied_promotions),
      variant_options: item.variant_options,
      variant_attachments: item.variant_attachments,
    })) || []
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
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
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
      </Tabs>
    </div>
  );
};
