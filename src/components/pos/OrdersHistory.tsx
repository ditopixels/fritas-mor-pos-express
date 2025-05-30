
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { SupabaseOrder } from "@/hooks/useOrders";
import { TransferViewModal } from "./TransferViewModal";

interface OrdersHistoryProps {
  orders: SupabaseOrder[];
}

export const OrdersHistory = ({ orders }: OrdersHistoryProps) => {
  const [selectedTransfer, setSelectedTransfer] = useState<{
    imageUrl: string;
    customerName: string;
  } | null>(null);

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Efectivo</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Transferencia</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Órdenes</CardTitle>
          <CardDescription>
            Lista completa de todas las órdenes realizadas
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500">No hay órdenes registradas</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <CardDescription>
                      Cliente: {order.customer_name} • {formatDate(order.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodBadge(order.payment_method)}
                    {order.payment_method === 'transfer' && order.photo_evidence && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTransfer({
                          imageUrl: order.photo_evidence!,
                          customerName: order.customer_name
                        })}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Transferencia
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Productos ({order.order_items?.length || 0})</h4>
                    <div className="space-y-1">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name} - {item.variant_name}</span>
                          <span>${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toLocaleString()}</span>
                    </div>
                    {order.total_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-${order.total_discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${order.total.toLocaleString()}</span>
                    </div>
                    {order.cash_received && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Efectivo recibido:</span>
                        <span>${order.cash_received.toLocaleString()}</span>
                      </div>
                    )}
                    {order.cash_received && order.cash_received > order.total && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Cambio:</span>
                        <span>${(order.cash_received - order.total).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedTransfer && (
        <TransferViewModal
          isOpen={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          imageUrl={selectedTransfer.imageUrl}
          customerName={selectedTransfer.customerName}
        />
      )}
    </div>
  );
};
