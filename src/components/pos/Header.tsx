
import { Clock, LogOut, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";

interface HeaderProps {
  user?: User;
  currentView?: string;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
}

export const Header = ({ user, currentView, onLogout, onNavigate }: HeaderProps) => {
  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <header className="bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <img 
              src="/lovable-uploads/262726dd-04dd-473f-8565-588c74af4070.png" 
              alt="Las Fritas Mor Logo" 
              className="h-8 w-8 sm:h-12 sm:w-12 bg-white rounded-full p-1 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Las Fritas Mor</h1>
              <p className="text-yellow-100 text-xs sm:text-sm hidden sm:block">Sistema de Punto de Venta</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap justify-end">
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3 order-2 sm:order-1">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                  </Badge>
                </div>

                {user.role === 'admin' && onNavigate && (
                  <div className="flex space-x-1 sm:space-x-2">
                    <Button
                      onClick={() => onNavigate('pos')}
                      variant={currentView === 'pos' ? 'secondary' : 'outline'}
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">POS</span>
                    </Button>
                    <Button
                      onClick={() => onNavigate('admin')}
                      variant={currentView === 'admin' ? 'secondary' : 'outline'}
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-1 sm:space-x-2 bg-white/20 rounded-lg px-2 sm:px-4 py-1 sm:py-2 order-1 sm:order-2">
              <Clock className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="font-semibold text-xs sm:text-base">{currentTime}</span>
            </div>
            
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3 order-3"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
