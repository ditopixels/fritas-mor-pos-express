
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Receipt, DollarSign } from "lucide-react";
import { Order } from "@/pages/Index";

interface OrdersHistoryProps {
  orders: Order[];
}

export const OrdersHistory = ({ orders }: OrdersHistoryProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const config = {
      cash: { label: "Efectivo", color: "bg-green-100 text-green-800" },
      transfer: { label: "Transferencia", color: "bg-blue-100 text-blue-800" }
    };
    
    const paymentConfig = config[method as keyof typeof config] || { label: method, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={paymentConfig.color}>
        {paymentConfig.label}
      </Badge>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No hay órdenes registradas
        </h3>
        <p className="text-gray-500">
          Las órdenes completadas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Órdenes</h2>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-orange-600">
                  {order.id}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getPaymentMethodBadge(order.paymentMethod)}
                  <Badge className="bg-green-100 text-green-800">
                    {order.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                <span>•</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Productos:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={`${item.sku}-${index}`} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-600 ml-1">- {item.variantName}</span>
                          <span className="text-gray-500 ml-2">(x{item.quantity})</span>
                        </div>
                        <span className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-gray-700">Total:</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">
                    {formatPrice(order.total * 1.19)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
