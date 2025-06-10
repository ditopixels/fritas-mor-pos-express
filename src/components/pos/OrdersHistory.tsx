
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, DollarSign, Package, User, CreditCard } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const OrdersHistory = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
                       format(new Date(order.created_at), 'yyyy-MM-dd') === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const parseJSONSafely = (jsonString: any) => {
    if (!jsonString) return {};
    if (typeof jsonString === 'object') return jsonString;
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente o número de orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 w-full sm:w-auto"
          />
        </div>
        {(searchTerm || dateFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setDateFilter("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || dateFilter ? "No se encontraron órdenes con los filtros aplicados" : "No hay órdenes registradas"}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {order.order_number}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(order.created_at), "PPpp", { locale: es })}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} w-fit`}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Cliente:</span>
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Pago:</span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-green-600">${order.total.toLocaleString()}</span>
                  </div>
                </div>

                {order.total_discount > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Descuento:</span>
                      <span>-${order.total_discount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Productos:</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => {
                        const variantOptions = parseJSONSafely(item.variant_options);
                        const variantAttachments = parseJSONSafely(item.variant_attachments);
                        
                        return (
                          <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.product_name}</div>
                                {item.variant_name && item.variant_name !== 'Estándar' && (
                                  <div className="text-xs text-gray-600">Variante: {item.variant_name}</div>
                                )}
                                <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                
                                {/* Show selected options */}
                                {Object.keys(variantOptions).length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs font-medium text-blue-700">Opciones:</div>
                                    {Object.entries(variantOptions).map(([key, value]) => (
                                      <div key={key} className="text-xs text-blue-600">
                                        {key}: {value as string}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Show selected attachments */}
                                {Object.keys(variantAttachments).length > 0 && (
                                  <div className="mt-1">
                                    <div className="text-xs font-medium text-purple-700">Elementos adicionales:</div>
                                    {Object.entries(variantAttachments).map(([key, values]) => 
                                      Array.isArray(values) && values.length > 0 && (
                                        <div key={key} className="text-xs text-purple-600">
                                          {key}: {values.join(', ')}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-2">
                                <div className="text-sm font-medium">
                                  {item.quantity}x ${item.price.toLocaleString()}
                                </div>
                                {item.original_price && item.original_price !== item.price && (
                                  <div className="text-xs text-gray-500 line-through">
                                    ${item.original_price.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
