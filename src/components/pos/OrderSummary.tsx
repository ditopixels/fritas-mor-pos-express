
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { CartItem } from "@/pages/Index";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (sku: string, quantity: number) => void;
  onRemoveItem: (sku: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
}

export const OrderSummary = ({
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment
}: OrderSummaryProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Pedido Actual</h2>
          </div>
          {items.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </Badge>
          )}
        </div>
        {items.length > 0 && (
          <Button
            onClick={onClearCart}
            variant="outline"
            size="sm"
            className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar todo
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Carrito vacío</p>
            <p className="text-sm">Selecciona productos para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.sku} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.productName}</h4>
                    <p className="text-xs text-gray-600">{item.variantName}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <Button
                    onClick={() => onRemoveItem(item.sku)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => onUpdateQuantity(item.sku, item.quantity - 1)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      onClick={() => onUpdateQuantity(item.sku, item.quantity + 1)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatPrice(item.price)} c/u</p>
                    <p className="font-bold text-orange-600">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (19%):</span>
              <span>{formatPrice(total * 0.19)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span className="text-orange-600">{formatPrice(total * 1.19)}</span>
            </div>
          </div>
          
          <Button
            onClick={onProceedToPayment}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 text-lg"
            size="lg"
          >
            Proceder al Pago
          </Button>
        </div>
      )}
    </div>
  );
};
