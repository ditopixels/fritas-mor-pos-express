
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SalesMetrics } from "./SalesMetrics";
import { RecentOrdersList } from "./RecentOrdersList";
import { CatalogManagement } from "./CatalogManagement";
import { PromotionsManagement } from "./PromotionsManagement";
import { ExpensesManagement } from "./ExpensesManagement";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 0),
  });
  const [includeCancelledOrders, setIncludeCancelledOrders] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">No tienes permisos para acceder al panel de administración.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona tu negocio desde aquí</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="promotions">Promociones</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="include-cancelled"
                checked={includeCancelledOrders}
                onCheckedChange={setIncludeCancelledOrders}
              />
              <Label htmlFor="include-cancelled" className="text-sm">
                Incluir canceladas
              </Label>
            </div>
          </div>
          <SalesMetrics dateRange={dateRange} includeCancelledOrders={includeCancelledOrders} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="include-cancelled-orders"
                checked={includeCancelledOrders}
                onCheckedChange={setIncludeCancelledOrders}
              />
              <Label htmlFor="include-cancelled-orders" className="text-sm">
                Incluir canceladas
              </Label>
            </div>
          </div>
          <RecentOrdersList dateRange={dateRange} includeCancelledOrders={includeCancelledOrders} />
        </TabsContent>

        <TabsContent value="catalog">
          <CatalogManagement />
        </TabsContent>

        <TabsContent value="promotions">
          <PromotionsManagement />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
