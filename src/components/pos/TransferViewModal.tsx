
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TransferViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  customerName: string;
}

export const TransferViewModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  customerName 
}: TransferViewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comprobante de Transferencia - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <img 
            src={imageUrl} 
            alt="Comprobante de transferencia" 
            className="max-w-full max-h-96 object-contain rounded-lg border shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
