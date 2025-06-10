
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Tag, Printer } from "lucide-react";
import { SupabaseOrder } from "@/hooks/useOrders";
import { TransferViewModal } from "./TransferViewModal";
import { usePrinterStatus } from "@/hooks/usePrinterStatus";
import { useToast } from "@/hooks/use-toast";

interface OrdersHistoryProps {
  orders: SupabaseOrder[];
}

export const OrdersHistory = ({ orders }: OrdersHistoryProps) => {
  const [selectedTransfer, setSelectedTransfer] = useState<{
    imageUrl: string;
    customerName: string;
  } | null>(null);
  
  const { printInvoice } = usePrinterStatus();
  const { toast } = useToast();

  const handlePrintOrder = async (order: SupabaseOrder) => {
    try {
      console.log('🖨️ Imprimiendo orden desde historial:', order.order_number);
      await printInvoice(order, 'cliente');
      
      toast({
        title: "Factura impresa",
        description: `Factura de orden #${order.order_number} impresa exitosamente`,
      });
    } catch (error) {
      console.error('❌ Error al imprimir desde historial:', error);
      toast({
        title: "Error de impresión",
        description: `Error al imprimir: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Efectivo</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Transferencia</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{method}</Badge>;
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

  const parseAppliedPromotions = (promotionsJson: any) => {
    if (!promotionsJson) return [];
    try {
      return typeof promotionsJson === 'string' ? JSON.parse(promotionsJson) : promotionsJson;
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Historial de Órdenes</CardTitle>
          <CardDescription className="text-sm">
            Lista completa de todas las órdenes realizadas
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500 text-sm">No hay órdenes registradas</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{order.order_number}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Cliente: {order.customer_name} • {formatDate(order.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 shrink-0">
                    {getPaymentMethodBadge(order.payment_method)}
                    <div className="flex space-x-2">
                      {order.payment_method === 'transfer' && order.photo_evidence && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTransfer({
                            imageUrl: order.photo_evidence!,
                            customerName: order.customer_name
                          })}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Transf.
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintOrder(order)}
                        className="text-xs"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold mb-2 text-sm">Productos ({order.order_items?.length || 0})</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item) => {
                        const itemPromotions = parseAppliedPromotions(item.applied_promotions);
                        const hasDiscount = item.original_price && item.original_price > item.price;
                        
                        return (
                          <div key={item.id} className="border rounded p-2 space-y-1 text-sm">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {item.quantity}x {item.product_name}
                                </div>
                                <div className="text-xs text-gray-600 truncate">{item.variant_name}</div>
                              </div>
                              <div className="text-right shrink-0">
                                {hasDiscount ? (
                                  <div className="space-y-1">
                                    <div className="text-xs text-gray-500 line-through">
                                      ${(item.original_price! * item.quantity).toLocaleString()}
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-red-600">
                                      ${(item.price * item.quantity).toLocaleString()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs sm:text-sm font-bold">
                                    ${(item.price * item.quantity).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {itemPromotions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {itemPromotions.map((promo: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    <Tag className="h-2 w-2 mr-1" />
                                    <span className="truncate max-w-24">
                                      {promo.promotionName}: -{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toLocaleString()}`}
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toLocaleString()}</span>
                    </div>
                    {order.total_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          Descuentos:
                        </span>
                        <span>-${order.total_discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${order.total.toLocaleString()}</span>
                    </div>
                    {order.cash_received && (
                      <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                        <span>Efectivo recibido:</span>
                        <span>${order.cash_received.toLocaleString()}</span>
                      </div>
                    )}
                    {order.cash_received && order.cash_received > order.total && (
                      <div className="flex justify-between text-xs sm:text-sm text-blue-600">
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
