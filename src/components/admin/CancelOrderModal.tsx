
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseOrder } from "@/hooks/useOrders";
import { AlertTriangle, X } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SupabaseOrder | null;
  onOrderCancelled: () => void;
}

export const CancelOrderModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onOrderCancelled 
}: CancelOrderModalProps) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "La razón de cancelación es obligatoria",
        variant: "destructive",
      });
      return;
    }

    if (!order) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason.trim()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Orden cancelada",
        description: `La orden #${order.order_number} ha sido cancelada exitosamente`,
      });

      onOrderCancelled();
      handleClose();
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la orden. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCancellationReason("");
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Orden
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar la orden <strong>#{order.order_number}</strong>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de cancelación *</Label>
            <Textarea
              id="reason"
              placeholder="Explica por qué se está cancelando esta orden..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Información de la orden:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Cliente: {order.customer_name}</p>
              <p>Total: ${order.total.toLocaleString()}</p>
              <p>Método de pago: {order.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !cancellationReason.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelando...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirmar Cancelación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
