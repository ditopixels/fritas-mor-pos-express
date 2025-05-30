
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Minus, Plus } from "lucide-react";
import { CartItem } from "@/types";
import { useCreateOrder } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (sku: string, newQuantity: number) => void;
  onRemoveItem: (sku: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (paymentMethod: string, customerName: string, cashReceived?: number, photoEvidence?: File) => void;
}

export const OrderSummary = ({ 
  items, 
  total, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onProceedToPayment 
}: OrderSummaryProps) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState<number | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const createOrderMutation = useCreateOrder();
  const { toast } = useToast();

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

    if (paymentMethod === "cash" && (!cashReceived || cashReceived < total)) {
      toast({
        title: "Error",
        description: "El monto en efectivo debe ser mayor o igual al total",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await createOrderMutation.mutateAsync({
        customer_name: customerName.trim(),
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : undefined,
        items,
      });

      toast({
        title: "¡Orden procesada!",
        description: `Orden completada para ${customerName}`,
      });

      // Limpiar formulario y carrito
      setCustomerName("");
      setPaymentMethod("");
      setCashReceived(undefined);
      onClearCart();
      
      // También llamar a la función original para mantener compatibilidad
      onProceedToPayment(paymentMethod, customerName, cashReceived);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la orden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const change = paymentMethod === "cash" && cashReceived ? cashReceived - total : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Resumen de Orden</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'producto' : 'productos'} en el carrito
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de productos */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">El carrito está vacío</p>
          ) : (
            items.map((item) => (
              <div key={item.sku} className="flex items-center justify-between space-x-2 p-2 border rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.variantName}</p>
                  <p className="text-sm font-bold">${item.price.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.sku, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.sku, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveItem(item.sku)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>

        {/* Formulario de pago */}
        {items.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="customer-name">Nombre del Cliente</Label>
              <Input
                id="customer-name"
                placeholder="Ingrese el nombre del cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="payment-method">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div>
                <Label htmlFor="cash-received">Efectivo Recibido</Label>
                <Input
                  id="cash-received"
                  type="number"
                  placeholder="0"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Number(e.target.value) || undefined)}
                />
                {cashReceived && cashReceived >= total && (
                  <p className="text-sm text-green-600 mt-1">
                    Cambio: ${change.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handlePayment}
                disabled={isProcessing || createOrderMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing || createOrderMutation.isPending ? "Procesando..." : "Procesar Pago"}
              </Button>
              
              <Button
                onClick={onClearCart}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                Limpiar Carrito
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
