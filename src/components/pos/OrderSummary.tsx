
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus, Plus, Camera, CreditCard, DollarSign, Tag } from "lucide-react";
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
  const [photoEvidence, setPhotoEvidence] = useState<File | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createOrderMutation = useCreateOrder();
  const { toast } = useToast();

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

    if (paymentMethod === "transfer" && !photoEvidence) {
      toast({
        title: "Error",
        description: "Por favor toma una foto del comprobante de transferencia",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let photoBase64 = undefined;
      if (photoEvidence) {
        const reader = new FileReader();
        photoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoEvidence);
        });
      }

      await createOrderMutation.mutateAsync({
        customer_name: customerName.trim(),
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : undefined,
        photo_evidence: photoBase64,
        items,
      });

      toast({
        title: "¡Orden procesada!",
        description: `Orden completada para ${customerName}`,
      });

      setCustomerName("");
      setPaymentMethod("");
      setCashReceived(undefined);
      setPhotoEvidence(undefined);
      onClearCart();
      onProceedToPayment(paymentMethod, customerName, cashReceived, photoEvidence);
      
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

  const subtotal = items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => {
    if (item.appliedPromotions && item.originalPrice) {
      const itemDiscount = item.appliedPromotions.reduce((acc, promo) => acc + promo.discountAmount, 0);
      return sum + (itemDiscount * item.quantity);
    }
    return sum;
  }, 0);

  const change = paymentMethod === "cash" && cashReceived ? cashReceived - total : 0;

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Resumen de Orden</CardTitle>
          <CardDescription>
            {items.length} {items.length === 1 ? 'producto' : 'productos'} en el carrito
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
          {/* Lista de productos - Toma la mayor parte del espacio */}
          <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
            ) : (
              items.map((item) => (
                <div key={item.sku} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500 break-words">{item.variantName}</p>
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

          {/* Totales y formulario - Parte inferior fija */}
          <div className="flex-shrink-0 space-y-4">
            {/* Totales */}
            {items.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      Descuentos:
                    </span>
                    <span>-${totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            )}

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
                  <Label>Método de Pago</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("cash")}
                      className="h-16 flex flex-col space-y-1"
                    >
                      <DollarSign className="h-5 w-5" />
                      <span>Efectivo</span>
                    </Button>
                    
                    <Button
                      variant={paymentMethod === "transfer" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("transfer")}
                      className="h-16 flex flex-col space-y-1"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Transferencia</span>
                    </Button>
                  </div>
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

                {paymentMethod === "transfer" && (
                  <div>
                    <Label>Comprobante de Transferencia</Label>
                    <div className="mt-2">
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
                        className="w-full h-16 flex flex-col space-y-1"
                      >
                        <Camera className="h-5 w-5" />
                        <span>
                          {photoEvidence ? "Foto Capturada" : "Tomar Foto"}
                        </span>
                      </Button>
                      {photoEvidence && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Comprobante guardado: {photoEvidence.name}
                        </p>
                      )}
                    </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
