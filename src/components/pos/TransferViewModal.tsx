
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 m-0 border-0 bg-black">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <img 
            src={imageUrl} 
            alt={`Comprobante de transferencia - ${customerName}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
