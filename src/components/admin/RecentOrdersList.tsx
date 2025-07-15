
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye, Printer, Tag, Ban } from "lucide-react";
import { SupabaseOrder } from "@/hooks/useOrders";
import { useIncrementalOrders } from "@/hooks/useIncrementalOrders";
import { TransferViewModal } from "@/components/pos/TransferViewModal";
import { CancelOrderModal } from "./CancelOrderModal";
import { usePrinterStatus } from "@/hooks/usePrinterStatus";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface RecentOrdersListProps {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  includeCancelledOrders?: boolean;
  customerNameFilter?: string;
}

export const RecentOrdersList = ({ dateRange, includeCancelledOrders = false, customerNameFilter = "" }: RecentOrdersListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransfer, setSelectedTransfer] = useState<{
    imageUrl: string;
    customerName: string;
  } | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<SupabaseOrder | null>(null);
  
  const itemsPerPage = 25;
  const offset = (currentPage - 1) * itemsPerPage;
  
  const { data: allOrders, isLoading, refetch } = useIncrementalOrders(1000);
  const { printInvoice } = usePrinterStatus();
  const { toast } = useToast();

  // Filtrar órdenes por rango de fechas, estado de cancelación y nombre de cliente
  const filteredOrders = allOrders?.filter(order => {
    // Filtro por fecha
    const dateFilter = !dateRange.from || !dateRange.to || 
      isWithinInterval(new Date(order.created_at), {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    
    // Filtro por estado de cancelación
    const statusFilter = includeCancelledOrders || order.status !== 'cancelled';
    
    // Filtro por nombre de cliente
    const customerFilter = !customerNameFilter.trim() || 
      order.customer_name.toLowerCase().includes(customerNameFilter.toLowerCase().trim());
    
    return dateFilter && statusFilter && customerFilter;
  }) || [];

  // Paginar órdenes filtradas
  const paginatedOrders = filteredOrders.slice(offset, offset + itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePrintOrder = async (order: SupabaseOrder) => {
    try {
      console.log('🖨️ Imprimiendo orden desde admin:', order.order_number);
      await printInvoice(order, 'cliente');
      
      toast({
        title: "Factura impresa",
        description: `Factura de orden #${order.order_number} impresa exitosamente`,
      });
    } catch (error) {
      console.error('❌ Error al imprimir desde admin:', error);
      toast({
        title: "Error de impresión",
        description: `Error al imprimir: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handleOrderCancelled = () => {
    refetch();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Cancelada</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">Pendiente</Badge>;
      case 'payment-pending':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">Pago Pendiente</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-2">Cargando órdenes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
              <CardDescription className="text-sm">
                {filteredOrders.length} órdenes encontradas - Página {currentPage} de {totalPages}
                {!includeCancelledOrders && " (excluyendo canceladas)"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {paginatedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500 text-sm">No hay órdenes en el período seleccionado</p>
            </CardContent>
          </Card>
        ) : (
          paginatedOrders.map((order) => (
            <Card key={order.id} className={`overflow-hidden ${order.status === 'cancelled' ? 'bg-red-50 border-red-200' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base sm:text-lg">{order.order_number}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      Cliente: <span className="font-medium">{order.customer_name}</span> • {formatDate(order.created_at)}
                      {order.status === 'cancelled' && order.cancellation_reason && (
                        <div className="text-red-600 mt-1">
                          <span className="font-medium">Razón de cancelación:</span> {order.cancellation_reason}
                        </div>
                      )}
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
                        disabled={order.status === 'cancelled'}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Imprimir
                      </Button>
                      {order.status === 'payment-pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* TODO: Implementar marcar como pagado */}}
                          className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Marcar Pagado
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setOrderToCancel(order)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 min-w-0">
                    <h4 className="font-semibold mb-2 text-sm">Productos ({order.order_items?.length || 0})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {order.order_items?.map((item) => {
                        const itemPromotions = parseAppliedPromotions(item.applied_promotions);
                        const hasDiscount = item.original_price && item.original_price > item.price;
                        
                        return (
                          <div key={item.id} className="border rounded p-2 space-y-1 text-sm bg-gray-50">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm">
                                  <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs mr-2">
                                    {item.quantity}x
                                  </span>
                                  {item.product_name}
                                </div>
                                <div className="text-xs text-gray-600 ml-6">{item.variant_name}</div>
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
                                    {promo.promotionName}: -{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toLocaleString()}`}
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
                    <div className={`p-3 rounded space-y-2 ${order.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">${order.subtotal.toLocaleString()}</span>
                      </div>
                      {order.total_discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            Descuentos:
                          </span>
                          <span className="font-medium">-${order.total_discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total:</span>
                        <span className={order.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}>
                          ${order.total.toLocaleString()}
                        </span>
                      </div>
                      {order.cash_received && (
                        <>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Efectivo recibido:</span>
                            <span>${order.cash_received.toLocaleString()}</span>
                          </div>
                          {order.cash_received > order.total && (
                            <div className="flex justify-between text-xs text-blue-600">
                              <span>Cambio:</span>
                              <span>${(order.cash_received - order.total).toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
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

      <CancelOrderModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        order={orderToCancel}
        onOrderCancelled={handleOrderCancelled}
      />
    </div>
  );
};
