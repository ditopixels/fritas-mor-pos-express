
import { Clock, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <header className="bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/262726dd-04dd-473f-8565-588c74af4070.png" 
              alt="Las Fritas Mor Logo" 
              className="h-12 w-12 bg-white rounded-full p-1"
            />
            <div>
              <h1 className="text-2xl font-bold">Las Fritas Mor</h1>
              <p className="text-yellow-100 text-sm">Sistema de Punto de Venta</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">{currentTime}</span>
            </div>
            
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
