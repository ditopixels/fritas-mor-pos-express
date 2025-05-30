
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TransferImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  customerName: string;
}

export const TransferImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  customerName 
}: TransferImageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprobante de Transferencia - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img 
            src={imageUrl} 
            alt="Comprobante de transferencia" 
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
