import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Minus, Plus, ShoppingCart, DollarSign, CreditCard, Camera, Eye, User } from "lucide-react";
import { CartItem, Order } from "@/pages/Index";
import { TransferImageModal } from "./TransferImageModal";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (sku: string, quantity: number) => void;
  onRemoveItem: (sku: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (paymentMethod: string, customerName: string, cashReceived?: number, photoEvidence?: File) => void;
  lastOrder?: Order;
}

export const OrderSummary = ({
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  lastOrder
}: OrderSummaryProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [photoEvidence, setPhotoEvidence] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWithTax = total * 1.19;

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return received - totalWithTax;
  };

  const isValidPayment = () => {
    if (!customerName.trim()) return false;
    if (paymentMethod === "cash") {
      const received = parseFloat(cashReceived) || 0;
      return received >= totalWithTax;
    }
    if (paymentMethod === "transfer") {
      return photoEvidence !== null;
    }
    return false;
  };

  const handleConfirmPayment = async () => {
    if (!isValidPayment()) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cashAmount = paymentMethod === "cash" ? parseFloat(cashReceived) : undefined;
    onProceedToPayment(paymentMethod, customerName.trim(), cashAmount, photoEvidence || undefined);
    
    // Reset state
    setPaymentMethod("");
    setCustomerName("");
    setCashReceived("");
    setPhotoEvidence(null);
    setIsProcessing(false);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoEvidence(file);
    }
  };

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

        {/* Información de la última orden */}
        {lastOrder && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  Última venta: {lastOrder.customerName}
                </span>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">
                {lastOrder.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
              </Badge>
            </div>
            
            {lastOrder.paymentMethod === "transfer" && lastOrder.photoEvidence && (
              <Button
                onClick={() => setShowTransferModal(true)}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver comprobante de transferencia
              </Button>
            )}
          </div>
        )}

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
        <div className="border-t p-4 bg-gray-50 space-y-4">
          {/* Customer Name */}
          <div>
            <Label htmlFor="customer-name" className="text-sm font-semibold">
              Nombre del Cliente *
            </Label>
            <Input
              id="customer-name"
              placeholder="Ingrese el nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Método de Pago *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className={`h-16 flex flex-col space-y-1 ${
                  paymentMethod === "cash" 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "hover:bg-orange-50"
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Efectivo</span>
              </Button>
              
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() => setPaymentMethod("transfer")}
                className={`h-16 flex flex-col space-y-1 ${
                  paymentMethod === "transfer" 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "hover:bg-orange-50"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">Transferencia</span>
              </Button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="cash-received" className="text-sm font-semibold">
                Efectivo Recibido *
              </Label>
              <Input
                id="cash-received"
                type="number"
                placeholder="Monto recibido"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="text-center"
              />
              
              {cashReceived && parseFloat(cashReceived) >= totalWithTax && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-green-800">Cambio:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(calculateChange())}
                    </span>
                  </div>
                </div>
              )}
              
              {cashReceived && parseFloat(cashReceived) < totalWithTax && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <span className="text-xs text-red-600">
                    Monto insuficiente
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Transfer Photo Evidence */}
          {paymentMethod === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="photo-evidence" className="text-sm font-semibold">
                Evidencia de Transferencia *
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="photo-evidence"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById("photo-evidence")?.click()}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {photoEvidence ? "Foto capturada ✓" : "Tomar foto del comprobante"}
                </Button>
              </div>
            </div>
          )}

          {/* Order Total */}
          <div className="space-y-2">
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
              <span className="text-orange-600">{formatPrice(totalWithTax)}</span>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <Button
            onClick={handleConfirmPayment}
            disabled={!isValidPayment() || isProcessing}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 text-lg"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              "Confirmar Pago"
            )}
          </Button>
        </div>
      )}

      {/* Modal para mostrar imagen de transferencia */}
      {lastOrder && lastOrder.photoEvidence && (
        <TransferImageModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          imageUrl={lastOrder.photoEvidence}
          customerName={lastOrder.customerName}
        />
      )}
    </div>
  );
};
