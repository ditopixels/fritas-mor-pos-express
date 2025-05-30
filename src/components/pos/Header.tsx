
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
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
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
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onNavigate('pos')}
                      variant={currentView === 'pos' ? 'secondary' : 'outline'}
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      POS
                    </Button>
                    <Button
                      onClick={() => onNavigate('admin')}
                      variant={currentView === 'admin' ? 'secondary' : 'outline'}
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </div>
                )}
              </div>
            )}
            
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
