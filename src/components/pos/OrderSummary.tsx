import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Minus, Plus, Camera, CreditCard, DollarSign, Tag, Printer } from "lucide-react";
import { CartItem } from "@/types";
import { useCreateOrder, SupabaseOrder } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";
import { usePrinterStatus } from "@/hooks/usePrinterStatus";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (sku: string, newQuantity: number) => void;
  onRemoveItem: (sku: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (paymentMethod: string, customerName: string, cashReceived?: number, photoEvidence?: File) => void;
  onOrderCreated?: (order: SupabaseOrder) => void;
}

export const OrderSummary = ({ 
  items, 
  total, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onProceedToPayment,
  onOrderCreated 
}: OrderSummaryProps) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState<number | undefined>();
  const [photoEvidence, setPhotoEvidence] = useState<File | undefined>();
  const [lastCreatedOrder, setLastCreatedOrder] = useState<SupabaseOrder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createOrderMutation = useCreateOrder(onOrderCreated);
  const { toast } = useToast();
  const { calculatePromotions } = usePromotionCalculator();
  const { printInvoice } = usePrinterStatus();

  // Calcular promociones aplicadas a los items del carrito
  const subtotal = items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  const promotionResult = calculatePromotions(items, subtotal);
  const totalWithPromotions = promotionResult.newSubtotal;

  console.log('OrderSummary - Items:', items);
  console.log('OrderSummary - Subtotal:', subtotal);
  console.log('OrderSummary - Promotion result:', promotionResult);
  console.log('OrderSummary - Total with promotions:', totalWithPromotions);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoEvidence(file);
      toast({
        title: "Foto capturada",
        description: "Comprobante de transferencia guardado",
      });
    }
  };

  const handlePrintInvoice = async (order: SupabaseOrder) => {
    console.log('=== IMPRIMIENDO FACTURA ===');
    console.log('📄 Orden a imprimir:', order);
    
    try {
      console.log('✅ Iniciando impresión de factura para orden:', order.order_number);
      
      await printInvoice(order, 'cliente');
      console.log('✅ Factura impresa exitosamente');
      
      toast({
        title: "Factura impresa",
        description: "Factura impresa exitosamente",
      });
      
    } catch (error) {
      console.error('❌ Error al imprimir factura:', error);
      toast({
        title: "Error de impresión",
        description: `Error al imprimir: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del cliente",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Por favor selecciona un método de pago",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "cash" && cashReceived && cashReceived < totalWithPromotions) {
      toast({
        title: "Error",
        description: "El monto en efectivo debe ser mayor o igual al total",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== PROCESANDO ORDEN ===');
      
      let photoBase64 = undefined;
      if (photoEvidence) {
        const reader = new FileReader();
        photoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoEvidence);
        });
      }

      const orderData = {
        customer_name: customerName.trim(),
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : undefined,
        photo_evidence: photoBase64,
        items: promotionResult.updatedItems,
      };

      console.log('Datos de la orden preparados:', orderData);

      // Limpiar formulario inmediatamente
      setCustomerName("");
      setPaymentMethod("");
      setCashReceived(undefined);
      setPhotoEvidence(undefined);
      onClearCart();
      onProceedToPayment(paymentMethod, customerName, cashReceived, photoEvidence);

      // Guardar orden
      console.log('💾 Guardando orden en base de datos...');
      const order = await createOrderMutation.mutateAsync(orderData);
      console.log('✅ Orden guardada exitosamente:', order);
      
      // Guardar la orden creada para el preview
      setLastCreatedOrder(order);
      
      // IMPRIMIR AUTOMÁTICAMENTE SIEMPRE
      console.log('🖨️ Imprimiendo automáticamente la orden creada...');
      await printInvoice(order, 'cliente');
      console.log('✅ Impresión automática completada');
      
      // Toast con posición a la izquierda
      toast({
        title: "¡Orden completada!",
        description: `Orden #${order.order_number} para ${orderData.customer_name} guardada e impresa`,
        className: "fixed left-4 top-4 z-50",
      });
      
    } catch (error: any) {
      console.error('❌ Error al procesar orden:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar la orden",
        variant: "destructive",
        className: "fixed left-4 top-4 z-50",
      });
    }
  };

  const change = paymentMethod === "cash" && cashReceived ? cashReceived - totalWithPromotions : 0;

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <CardTitle className="text-lg">Resumen de Orden</CardTitle>
          <CardDescription className="text-sm">
            {items.length} {items.length === 1 ? 'producto' : 'productos'} en el carrito
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Lista de productos con scroll */}
          <div className="flex-1 min-h-0">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500 text-center">El carrito está vacío</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-2">
                  {promotionResult.updatedItems.map((item) => (
                    <div key={item.sku} className="flex items-start justify-between space-x-3 p-3 border rounded-lg bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500 break-words line-clamp-2">{item.variantName}</p>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {item.originalPrice && item.originalPrice > item.price ? (
                            <>
                              <span className="text-xs text-gray-500 line-through">
                                ${item.originalPrice.toLocaleString()}
                              </span>
                              <span className="text-sm font-bold text-red-600">
                                ${item.price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold">${item.price.toLocaleString()}</span>
                          )}
                        </div>
                        
                        {item.appliedPromotions && item.appliedPromotions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.appliedPromotions.map((promo, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                <Tag className="h-2 w-2 mr-1" />
                                {promo.promotionName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.sku, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.sku, item.quantity + 1)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveItem(item.sku)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Preview de última orden creada */}
          {lastCreatedOrder && (
            <div className="flex-shrink-0 mt-4 p-3 border rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Última orden creada</p>
                  <p className="text-xs text-green-600">#{lastCreatedOrder.order_number} - {lastCreatedOrder.customer_name}</p>
                </div>
                <Button
                  onClick={() => handlePrintInvoice(lastCreatedOrder)}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}

          {/* Totales y formulario de pago - sticky al bottom */}
          {items.length > 0 && (
            <div className="flex-shrink-0 space-y-4 border-t pt-4 mt-4 bg-white">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                
                {promotionResult.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      Descuentos:
                    </span>
                    <span>-${promotionResult.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${totalWithPromotions.toLocaleString()}</span>
                </div>
              </div>

              {/* Formulario de pago */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customer-name" className="text-sm">Nombre del Cliente</Label>
                  <Input
                    id="customer-name"
                    placeholder="Ingrese el nombre del cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm">Método de Pago</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("cash")}
                      className="h-12 flex flex-col space-y-1 text-xs"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Efectivo</span>
                    </Button>
                    
                    <Button
                      variant={paymentMethod === "transfer" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("transfer")}
                      className="h-12 flex flex-col space-y-1 text-xs"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Transferencia</span>
                    </Button>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <Label htmlFor="cash-received" className="text-sm">Efectivo Recibido (Opcional)</Label>
                    <Input
                      id="cash-received"
                      type="number"
                      placeholder="0"
                      value={cashReceived || ""}
                      onChange={(e) => setCashReceived(Number(e.target.value) || undefined)}
                      className="mt-1"
                    />
                    {cashReceived && cashReceived >= totalWithPromotions && (
                      <p className="text-sm text-green-600 mt-1">
                        Cambio: ${change.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === "transfer" && (
                  <div>
                    <Label className="text-sm">Comprobante de Transferencia (Opcional)</Label>
                    <div className="mt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-12 flex flex-col space-y-1 text-xs"
                      >
                        <Camera className="h-4 w-4" />
                        <span>
                          {photoEvidence ? "Foto Capturada" : "Tomar Foto (Opcional)"}
                        </span>
                      </Button>
                      {photoEvidence && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Comprobante guardado: {photoEvidence.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handlePayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <span>Procesar Pago</span>
                  </Button>
                  
                  <Button
                    onClick={onClearCart}
                    variant="outline"
                    className="w-full"
                  >
                    Limpiar Carrito
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
