
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (paymentMethod: string, cashReceived?: number) => void;
}

export const PaymentModal = ({ isOpen, onClose, total, onConfirmPayment }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalWithTax = total * 1.19;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return received - totalWithTax;
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cashAmount = paymentMethod === "cash" ? parseFloat(cashReceived) : undefined;
    onConfirmPayment(paymentMethod, cashAmount);
    
    // Reset state
    setPaymentMethod("");
    setCashReceived("");
    setIsProcessing(false);
  };

  const isValidPayment = () => {
    if (paymentMethod === "cash") {
      const received = parseFloat(cashReceived) || 0;
      return received >= totalWithTax;
    }
    return paymentMethod !== "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del total */}
          <div className="bg-gray-50 rounded-lg p-4">
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
                <span>TOTAL A PAGAR:</span>
                <span className="text-orange-600">{formatPrice(totalWithTax)}</span>
              </div>
            </div>
          </div>

          {/* Selección de método de pago */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Método de Pago
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className={`h-20 flex flex-col space-y-2 ${
                  paymentMethod === "cash" 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "hover:bg-orange-50"
                }`}
              >
                <DollarSign className="h-6 w-6" />
                <span>Efectivo</span>
              </Button>
              
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() => setPaymentMethod("transfer")}
                className={`h-20 flex flex-col space-y-2 ${
                  paymentMethod === "transfer" 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "hover:bg-orange-50"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span>Transferencia</span>
              </Button>
            </div>
          </div>

          {/* Campo de efectivo recibido */}
          {paymentMethod === "cash" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cash-received" className="text-base font-semibold">
                  Efectivo Recibido
                </Label>
                <Input
                  id="cash-received"
                  type="number"
                  placeholder="Ingrese el monto recibido"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-lg text-center"
                />
              </div>
              
              {cashReceived && parseFloat(cashReceived) >= totalWithTax && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">Cambio:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(calculateChange())}
                    </span>
                  </div>
                </div>
              )}
              
              {cashReceived && parseFloat(cashReceived) < totalWithTax && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-sm text-red-600">
                    El monto recibido es insuficiente
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleConfirmPayment}
              disabled={!isValidPayment() || isProcessing}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirmar Pago</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
