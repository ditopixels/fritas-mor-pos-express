
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "./PaymentModal";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/types";

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const handlePayment = (paymentMethod: string, cashReceived?: number, photoEvidence?: File) => {
    onProceedToPayment(paymentMethod, customerName, cashReceived, photoEvidence);
    setIsPaymentModalOpen(false);
    setCustomerName("");
  };

  const subtotal = total;
  const totalDiscount = items.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price;
    return sum + ((originalPrice - item.price) * item.quantity);
  }, 0);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Resumen de Compra</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'artículo' : 'artículos'} en el carrito
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nombre del Cliente</Label>
          <Input
            id="customer-name"
            type="text"
            placeholder="Ingrese el nombre del cliente"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <Separator />

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay artículos en el carrito
            </p>
          ) : (
            items.map((item) => {
              const originalPrice = item.originalPrice || item.price;
              const hasDiscount = originalPrice > item.price;
              
              return (
                <div key={item.sku} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.productName}</h4>
                      {item.variantName && (
                        <p className="text-xs text-gray-600">{item.variantName}</p>
                      )}
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.sku)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.sku, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.sku, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      {hasDiscount && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500 line-through">
                            ${(originalPrice * item.quantity).toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            -{Math.round(((originalPrice - item.price) / originalPrice) * 100)}%
                          </Badge>
                        </div>
                      )}
                      <p className="font-medium text-sm">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {item.appliedPromotions && item.appliedPromotions.length > 0 && (
                    <div className="space-y-1">
                      {item.appliedPromotions.map((promo, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {promo.promotionName}
                          </Badge>
                          <span className="text-xs text-green-600">
                            -{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos aplicados:</span>
                  <span>-${totalDiscount.toLocaleString()}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={!customerName.trim()}
              >
                Proceder al Pago
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={onClearCart}
              >
                Limpiar Carrito
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onConfirmPayment={handlePayment}
      />
    </Card>
  );
};
