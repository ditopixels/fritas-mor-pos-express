
import { Clock, Store } from "lucide-react";

export const Header = () => {
  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Las Fritas Mor</h1>
              <p className="text-orange-100 text-sm">Sistema de Punto de Venta</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">{currentTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
