
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(loginData.email, loginData.password);
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al iniciar sesión',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src="/lovable-uploads/262726dd-04dd-473f-8565-588c74af4070.png" 
            alt="Las Fritas Mor Logo" 
            className="h-20 w-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">Las Fritas Mor</h1>
          <p className="text-gray-600">Sistema de Punto de Venta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
