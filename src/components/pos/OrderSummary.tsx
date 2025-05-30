import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, FileImage, RefreshCcw, Truck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CartItem, Order } from "@/types";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (sku: string, quantity: number) => void;
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | undefined>(undefined);
  const [photoEvidence, setPhotoEvidence] = useState<File | undefined>(undefined);

  const handleQuantityChange = (sku: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(event.target.value);
    if (!isNaN(newQuantity)) {
      onUpdateQuantity(sku, newQuantity);
    }
  };

  const handleProceedToPayment = () => {
    setIsPaymentOpen(true);
  };

  const confirmPayment = () => {
    onProceedToPayment(paymentMethod, customerName, cashReceived, photoEvidence);
    setIsPaymentOpen(false);
    setCustomerName("");
    setPaymentMethod("cash");
    setCashReceived(undefined);
    setPhotoEvidence(undefined);
  };

  const handleCashReceivedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setCashReceived(isNaN(value) ? undefined : value);
  };

  const handlePhotoEvidenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setPhotoEvidence(event.target.files[0]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Resumen de Orden</CardTitle>
        <CardDescription>
          Revisa los productos y completa la orden
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto h-full flex-grow">
        <ScrollArea className="rounded-md border h-full">
          <div className="p-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500">
                No hay productos en el carrito
              </div>
            ) : (
              items.map((item) => (
                <div key={item.sku} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2">
                    <img src={item.image} alt={item.productName} className="w-12 h-12 rounded" />
                    <div>
                      <div className="font-semibold">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.variantName}</div>
                      {item.appliedPromotions && item.appliedPromotions.length > 0 && (
                        <div className="text-xs text-green-600">
                          {item.appliedPromotions.map(promo => (
                            <Badge key={promo.promotionId} variant="outline" className="mr-1">
                              {promo.promotionName} (-{formatPrice(promo.discountAmount)})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      min="0"
                      defaultValue={item.quantity}
                      onChange={(e) => handleQuantityChange(item.sku, e)}
                      className="w-16 text-center"
                    />
                    <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.sku)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="space-y-2">
          <div className="text-xl font-semibold">Total: {formatPrice(total)}</div>
        </div>
        {items.length > 0 && (
          <>
            <Input
              type="text"
              placeholder="Nombre del cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Button className="w-full" onClick={handleProceedToPayment}>
              Proceder al Pago
            </Button>
          </>
        )}
        {items.length > 0 && (
          <Button variant="destructive" className="w-full" onClick={onClearCart}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Limpiar Carrito
          </Button>
        )}
      </CardFooter>

      {/* Payment Dialog */}
      <AlertDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pago</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el método de pago y confirma la orden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Método de Pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Efectivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cashReceived" className="text-right">
                  Efectivo Recibido
                </Label>
                <Input
                  type="number"
                  id="cashReceived"
                  placeholder="0.00"
                  className="col-span-3"
                  onChange={handleCashReceivedChange}
                />
              </div>
            )}

            {paymentMethod === "transfer" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="photoEvidence" className="text-right">
                  Foto de Evidencia
                </Label>
                <Input
                  type="file"
                  id="photoEvidence"
                  className="col-span-3"
                  onChange={handlePhotoEvidenceChange}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPaymentOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayment}>
              Confirmar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
