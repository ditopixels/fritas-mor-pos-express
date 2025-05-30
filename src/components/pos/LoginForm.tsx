
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User } from "lucide-react";
import { User as UserType } from "@/types";

interface LoginFormProps {
  onLogin: (user: UserType) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Demo users
  const demoUsers: UserType[] = [
    {
      id: "1",
      username: "admin",
      role: "admin",
      name: "Administrador"
    },
    {
      id: "2",
      username: "cajero",
      role: "cashier",
      name: "Cajero Principal"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = demoUsers.find(u => u.username === username);
    
    if (user && (password === "lasfritas2024" || password === "cajero123")) {
      onLogin(user);
    } else {
      setError("Credenciales incorrectas");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-md mx-2 sm:mx-0">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img 
              src="/lovable-uploads/262726dd-04dd-473f-8565-588c74af4070.png" 
              alt="Las Fritas Mor Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
            Las Fritas Mor
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sistema de Punto de Venta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-semibold">
                Usuario
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold">
                Contraseña
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white font-bold py-3 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Ingresando...</span>
                </div>
              ) : (
                "Ingresar al Sistema"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 space-y-2">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Demo - Usuarios disponibles:</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500 break-words">
                <strong>Administrador:</strong> usuario: <code className="text-xs">admin</code> | contraseña: <code className="text-xs">lasfritas2024</code>
              </p>
              <p className="text-xs text-gray-500 break-words">
                <strong>Cajero:</strong> usuario: <code className="text-xs">cajero</code> | contraseña: <code className="text-xs">cajero123</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
